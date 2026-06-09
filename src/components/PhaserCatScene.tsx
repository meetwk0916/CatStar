import { useEffect, useRef } from "react";
import * as Phaser from "phaser";
import { getCompanionReaction } from "../domain/catFsm";
import type { CatPalette, CatPersonality } from "../types";

interface PhaserCatSceneProps {
  palette: CatPalette;
  personality: CatPersonality;
  showStardust: boolean;
  onInteract: (message: string) => void;
}

interface CollisionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

type CatAction = "idle" | "walk" | "jump" | "sleep" | "interact";
type CollisionConfig = Record<string, CollisionRect>;
type EnvironmentZoneKind = "floor" | "perch" | "rest" | "food" | "blocker";
type CatRoutine = "approachWindowBench" | "perchWindowBench" | "floorPause";

interface EnvironmentZone {
  id: string;
  kind: EnvironmentZoneKind;
  xMin: number;
  xMax: number;
}

interface CatAnimationSpec {
  frameWidth: number;
  frameHeight: number;
  actions: Record<
    CatAction,
    {
      file: string;
      frames: number;
      frameRate: number;
      repeat: number;
    }
  >;
}

interface ScriptedJump {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  startedAt: number;
  duration: number;
  peakHeight: number;
  landingRoutine: CatRoutine;
}

const SCENE_ASSET_ROOT = "/assets/scenes/window-room";

const PERSONALITY_SPEED: Record<CatPersonality, number> = {
  GLUTTON: 32,
  ALOOFS: 26,
  CLINGY: 30,
  ENERGY: 40,
};

const PHYSICAL_SURFACES = new Set(["floor"]);

const ENVIRONMENT_ZONES: EnvironmentZone[] = [
  { id: "floor-left", kind: "floor", xMin: 130, xMax: 230 },
  { id: "floor-center", kind: "floor", xMin: 250, xMax: 430 },
  { id: "windowBench", kind: "perch", xMin: 180, xMax: 360 },
  { id: "catBed", kind: "rest", xMin: 60, xMax: 115 },
  { id: "rightTray", kind: "food", xMin: 505, xMax: 575 },
  { id: "plant", kind: "blocker", xMin: 480, xMax: 545 },
];

const findZone = (id: string) => {
  const zone = ENVIRONMENT_ZONES.find((candidate) => candidate.id === id);
  if (!zone) {
    throw new Error(`Missing CatStar environment zone: ${id}`);
  }
  return zone;
};

const ARRIVAL_DISTANCE = 8;
const FLOOR_STAND_Y = 225;
const WINDOW_BENCH_STAND_Y = 140;
const WINDOW_BENCH_ZONE = findZone("windowBench");
const FLOOR_CENTER_ZONE = findZone("floor-center");
const FLOOR_LEFT_ZONE = findZone("floor-left");
const WINDOW_BENCH_TAKEOFF_X = WINDOW_BENCH_ZONE.xMax - 28;
const WINDOW_BENCH_LANDING_X = (WINDOW_BENCH_ZONE.xMin + WINDOW_BENCH_ZONE.xMax) / 2 + 16;
const FLOOR_RETURN_X = FLOOR_CENTER_ZONE.xMin + 72;
const FLOOR_PAUSE_X = FLOOR_LEFT_ZONE.xMax - 15;

class CatRoomScene extends Phaser.Scene {
  private cat?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private targetX = WINDOW_BENCH_TAKEOFF_X;
  private routine: CatRoutine = "approachWindowBench";
  private routineHoldUntil = 0;
  private scriptedJump?: ScriptedJump;
  private walkPaceSeed = 0;
  private showStardust = false;
  private personality: CatPersonality = "CLINGY";
  private onInteract: (message: string) => void = () => {};

  constructor() {
    super("cat-room");
  }

  init(data: PhaserCatSceneProps) {
    this.personality = data.personality;
    this.showStardust = data.showStardust;
    this.walkPaceSeed = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this.onInteract = data.onInteract;
  }

  preload() {
    this.load.image("window-room-background", `${SCENE_ASSET_ROOT}/background.png`);
    this.load.json("window-room-collision", `${SCENE_ASSET_ROOT}/collision.json`);
    this.load.json("cat-animation-spec", `${SCENE_ASSET_ROOT}/cat/cat.animations.json`);
    (["idle", "walk", "jump", "sleep", "interact"] as CatAction[]).forEach((action) => {
      this.load.spritesheet(`cat-${action}`, `${SCENE_ASSET_ROOT}/cat/${action}.png`, {
        frameWidth: 96,
        frameHeight: 96,
      });
    });
  }

  create() {
    this.physics.world.setBounds(0, 0, 640, 360);
    this.createPhysicsTexture();
    this.createParticleTexture();
    this.add.image(320, 180, "window-room-background").setDisplaySize(640, 360).setDepth(0);
    this.createCatAnimations();
    this.createSceneObjects();
    this.createCat();
  }

  update(time: number) {
    if (!this.cat) {
      return;
    }

    if (this.scriptedJump) {
      this.updateScriptedJump(time);
      return;
    }

    this.updatePurposefulRoutine(time);
  }

  private createSceneObjects() {
    const collision = this.cache.json.get("window-room-collision") as CollisionConfig;
    const colliders = Object.entries(collision)
      .filter(([name]) => PHYSICAL_SURFACES.has(name))
      .map(([name, rect]) =>
        this.physics.add
          .staticImage(rect.x, rect.y, "physics-pixel")
          .setName(name)
          .setSize(rect.width, rect.height)
          .setVisible(false)
          .refreshBody(),
      );

    this.registry.set("catstar-colliders", colliders);
  }

  private createCat() {
    this.cat = this.physics.add.sprite(320, FLOOR_STAND_Y, "cat-idle");
    this.cat.setDisplaySize(88, 88);
    this.cat.setCollideWorldBounds(true);
    this.cat.setGravityY(0);
    this.cat.body.setAllowGravity(false);
    this.cat.setBounce(0);
    this.cat.setDepth(5);
    this.cat.setInteractive({ useHandCursor: true });
    this.cat.on("pointerdown", () => this.interact());

    this.cat.setSize(48, 76);
    this.cat.setOffset(24, 18);
    this.playCatAction("idle");

    const colliders = this.registry.get("catstar-colliders") as Phaser.Physics.Arcade.Image[] | undefined;
    colliders?.forEach((collider) => {
      if (this.cat) {
        this.physics.add.collider(this.cat, collider);
      }
    });

    if (this.showStardust) {
      this.addStardust();
    }
  }

  private interact() {
    if (!this.cat) {
      return;
    }

    this.cat.setVelocityX(0);
    this.playCatAction("interact", true);
    this.tweens.add({
      targets: this.cat,
      angle: { from: -4, to: 4 },
      duration: 100,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        if (this.cat) {
          this.cat.angle = 0;
        }
      },
    });
    this.onInteract(getCompanionReaction("INTERACTING"));
  }

  private updatePurposefulRoutine(time: number) {
    if (!this.cat) {
      return;
    }

    if (this.routine === "approachWindowBench") {
      this.cat.body.setAllowGravity(false);
      this.cat.setY(FLOOR_STAND_Y);
      if (time < this.routineHoldUntil) {
        this.cat.setVelocityX(0);
        this.playCatAction("idle");
        return;
      }

      this.targetX = WINDOW_BENCH_TAKEOFF_X;
      if (this.moveTowardTarget(WINDOW_BENCH_TAKEOFF_X)) {
        this.startScriptedJump(time, {
          toX: WINDOW_BENCH_LANDING_X,
          toY: WINDOW_BENCH_STAND_Y,
          duration: 880,
          peakHeight: 58,
          landingRoutine: "perchWindowBench",
        });
      }
      return;
    }

    if (this.routine === "perchWindowBench") {
      this.cat.body.setAllowGravity(false);
      this.cat.setVelocity(0, 0);
      this.cat.setY(WINDOW_BENCH_STAND_Y);
      this.playCatAction(time > this.routineHoldUntil - 1400 ? "idle" : "sleep");

      if (time >= this.routineHoldUntil) {
        this.startScriptedJump(time, {
          toX: FLOOR_RETURN_X,
          toY: FLOOR_STAND_Y,
          duration: 760,
          peakHeight: 42,
          landingRoutine: "floorPause",
        });
      }
      return;
    }

    this.cat.body.setAllowGravity(false);
    this.cat.setY(FLOOR_STAND_Y);
    if (time >= this.routineHoldUntil) {
      this.targetX = FLOOR_PAUSE_X;
      if (this.moveTowardTarget(FLOOR_PAUSE_X)) {
        this.cat.setVelocityX(0);
        this.playCatAction("idle");
        this.routineHoldUntil = time + Phaser.Math.Between(900, 1500);
        this.routine = "approachWindowBench";
      }
      return;
    }

    this.cat.setVelocityX(0);
    this.playCatAction("idle");
  }

  private moveTowardTarget(targetX: number) {
    if (!this.cat) {
      return false;
    }

    const distance = targetX - this.cat.x;
    const currentVelocityX = this.cat.body.velocity.x;
    if (Math.abs(distance) < ARRIVAL_DISTANCE) {
      const easedStopVelocityX = Phaser.Math.Linear(currentVelocityX, 0, 0.18);
      this.cat.setVelocityX(Math.abs(easedStopVelocityX) < 4 ? 0 : easedStopVelocityX);
      this.playCatAction("idle");
      return Math.abs(easedStopVelocityX) < 5;
    }

    const baseSpeed = PERSONALITY_SPEED[this.personality];
    const distanceEase = Phaser.Math.Clamp(Math.abs(distance) / 72, 0.22, 1);
    const time = this.time.now;
    const curiousSlowdown = 0.84 + Math.sin(time * 0.0034 + this.walkPaceSeed) * 0.16;
    const tinyHesitation = Math.sin(time * 0.0017 + this.walkPaceSeed * 0.7) > 0.94 ? 0.58 : 1;
    const speed = baseSpeed * distanceEase * curiousSlowdown * tinyHesitation;
    const targetVelocityX = distance > 0 ? speed : -speed;
    const easedVelocityX = Phaser.Math.Linear(this.cat.body.velocity.x, targetVelocityX, 0.08);
    this.cat.setVelocityX(easedVelocityX);
    this.cat.setFlipX(distance < 0);
    this.playCatAction("walk");
    return false;
  }

  private startScriptedJump(
    time: number,
    options: {
      toX: number;
      toY: number;
      duration: number;
      peakHeight: number;
      landingRoutine: CatRoutine;
    },
  ) {
    if (!this.cat) {
      return;
    }

    this.cat.body.setAllowGravity(false);
    this.cat.setVelocity(0, 0);
    this.cat.setFlipX(options.toX < this.cat.x);
    this.scriptedJump = {
      fromX: this.cat.x,
      fromY: this.cat.y,
      toX: options.toX,
      toY: options.toY,
      startedAt: time,
      duration: options.duration,
      peakHeight: options.peakHeight,
      landingRoutine: options.landingRoutine,
    };
    this.playCatAction("jump", true);
  }

  private updateScriptedJump(time: number) {
    if (!this.cat || !this.scriptedJump) {
      return;
    }

    const jump = this.scriptedJump;
    const progress = Phaser.Math.Clamp((time - jump.startedAt) / jump.duration, 0, 1);
    const easedProgress = Phaser.Math.Easing.Sine.InOut(progress);
    const arcY = Math.sin(progress * Math.PI) * jump.peakHeight;
    const x = Phaser.Math.Linear(jump.fromX, jump.toX, easedProgress);
    const y = Phaser.Math.Linear(jump.fromY, jump.toY, easedProgress) - arcY;

    this.cat.body.setAllowGravity(false);
    this.cat.setVelocity(0, 0);
    this.cat.setPosition(x, y);
    this.playCatAction("jump");

    if (progress >= 1) {
      this.cat.setPosition(jump.toX, jump.toY);
      this.scriptedJump = undefined;
      this.routine = jump.landingRoutine;
      this.targetX = jump.toX;

      if (jump.landingRoutine === "perchWindowBench") {
        this.cat.body.setAllowGravity(false);
        this.routineHoldUntil = time + Phaser.Math.Between(3200, 5200);
        this.playCatAction("idle", true);
        return;
      }

      this.cat.body.setAllowGravity(false);
      this.cat.setY(FLOOR_STAND_Y);
      this.routineHoldUntil = time + Phaser.Math.Between(700, 1200);
      this.playCatAction("idle", true);
    }
  }

  private addStardust() {
    const particles = this.add.particles(0, 0, "star-pixel", {
      x: { min: 250, max: 390 },
      y: { min: 90, max: 210 },
      lifespan: 1600,
      speedY: { min: -8, max: 16 },
      speedX: { min: -14, max: 14 },
      quantity: 1,
      frequency: 360,
      scale: { start: 1.5, end: 0 },
      alpha: { start: 0.9, end: 0 },
    });
    particles.setDepth(10);
  }

  private createCatAnimations() {
    const spec = this.cache.json.get("cat-animation-spec") as CatAnimationSpec;
    (Object.keys(spec.actions) as CatAction[]).forEach((action) => {
      const config = spec.actions[action];
      this.anims.create({
        key: `cat-${action}-anim`,
        frames: this.anims.generateFrameNumbers(`cat-${action}`, {
          start: 0,
          end: config.frames - 1,
        }),
        frameRate: action === "walk" ? 6 : config.frameRate,
        repeat: config.repeat,
      });
    });
  }

  private playCatAction(action: CatAction, restart = false) {
    if (!this.cat) {
      return;
    }

    const key = `cat-${action}-anim`;
    if (!restart && this.cat.anims.currentAnim?.key === key) {
      return;
    }

    this.cat.play(key, !restart);
  }

  private createParticleTexture() {
    const star = this.make.graphics({ x: 0, y: 0 }, false);
    star.fillStyle(0xffe88a);
    star.fillRect(0, 0, 4, 4);
    star.generateTexture("star-pixel", 4, 4);
    star.destroy();
  }

  private createPhysicsTexture() {
    const pixel = this.make.graphics({ x: 0, y: 0 }, false);
    pixel.fillStyle(0xffffff, 0);
    pixel.fillRect(0, 0, 1, 1);
    pixel.generateTexture("physics-pixel", 1, 1);
    pixel.destroy();
  }
}

export default function PhaserCatScene(props: PhaserCatSceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: 640,
      height: 360,
      backgroundColor: "#202433",
      pixelArt: true,
      physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 0, x: 0 },
          debug: false,
        },
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 640,
        height: 360,
      },
      scene: CatRoomScene,
    });

    game.scene.start("cat-room", props);

    return () => {
      game.destroy(true);
    };
  }, [props.palette, props.personality, props.showStardust, props.onInteract]);

  return <div ref={containerRef} className="h-full w-full" />;
}
