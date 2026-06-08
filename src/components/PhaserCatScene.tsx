import { useEffect, useRef } from "react";
import * as Phaser from "phaser";
import { chooseNextState, getCompanionReaction } from "../domain/catFsm";
import type { CatFsmState, CatPalette, CatPersonality } from "../types";

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

const SCENE_ASSET_ROOT = "/assets/scenes/window-room";

const PERSONALITY_SPEED: Record<CatPersonality, number> = {
  GLUTTON: 54,
  ALOOFS: 42,
  CLINGY: 50,
  ENERGY: 72,
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

const WALKABLE_ZONES = ENVIRONMENT_ZONES.filter((zone) => zone.kind === "floor");
const JUMP_TARGET_ZONES = ENVIRONMENT_ZONES.filter((zone) => zone.kind === "floor");

class CatRoomScene extends Phaser.Scene {
  private cat?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private targetX = 260;
  private nextDecisionAt = 0;
  private state: CatFsmState = "IDLE";
  private showStardust = false;
  private personality: CatPersonality = "CLINGY";
  private jumpLandingX?: number;
  private jumpTakeoffX?: number;
  private jumpStartedAt = 0;
  private isPreparingJump = false;
  private onInteract: (message: string) => void = () => {};

  constructor() {
    super("cat-room");
  }

  init(data: PhaserCatSceneProps) {
    this.personality = data.personality;
    this.showStardust = data.showStardust;
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

    if (this.state === "JUMPING" || this.isPreparingJump) {
      this.updateJumpState(time);
      return;
    }

    if (time >= this.nextDecisionAt) {
      this.chooseNextMove(time);
    }

    const distance = this.targetX - this.cat.x;
    if (this.state === "SLEEPING" || this.state === "EATING") {
      this.cat.setVelocityX(0);
      this.playCatAction(this.state === "SLEEPING" ? "sleep" : "idle");
      return;
    }

    if (Math.abs(distance) < 8 || this.state === "IDLE") {
      this.cat.setVelocityX(0);
      this.playCatAction("idle");
      return;
    }

    const speed = PERSONALITY_SPEED[this.personality];
    const targetVelocityX = distance > 0 ? speed : -speed;
    const easedVelocityX = Phaser.Math.Linear(this.cat.body.velocity.x, targetVelocityX, 0.14);
    this.cat.setVelocityX(easedVelocityX);
    this.cat.setFlipX(distance < 0);
    this.playCatAction("walk");
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
    this.cat = this.physics.add.sprite(320, 120, "cat-idle");
    this.cat.setDisplaySize(88, 88);
    this.cat.setCollideWorldBounds(true);
    this.cat.setGravityY(620);
    this.cat.setBounce(0.08);
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

  private chooseNextMove(time: number) {
    this.nextDecisionAt = time + Phaser.Math.Between(1800, 3800);
    this.state = chooseNextState(this.personality);

    if (this.state === "WALKING") {
      this.targetX = this.chooseWalkTarget();
    }

    if (this.state === "JUMPING") {
      this.startJump(time);
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

  private chooseWalkTarget() {
    const zone = Phaser.Utils.Array.GetRandom(WALKABLE_ZONES);
    return Phaser.Math.Between(zone.xMin, zone.xMax);
  }

  private chooseJumpTarget() {
    if (!this.cat) {
      const zone = Phaser.Utils.Array.GetRandom(JUMP_TARGET_ZONES);
      return Phaser.Math.Between(zone.xMin, zone.xMax);
    }

    const direction = this.cat.x < 300 ? 1 : -1;
    const distance = Phaser.Math.Between(110, 170);
    return Phaser.Math.Clamp(this.cat.x + direction * distance, 145, 430);
  }

  private startJump(time: number) {
    if (!this.cat || this.isPreparingJump || !this.cat.body.blocked.down) {
      return;
    }

    this.isPreparingJump = true;
    this.jumpTakeoffX = this.cat.x;
    this.jumpLandingX = this.chooseJumpTarget();
    this.targetX = this.jumpLandingX;
    this.cat.setVelocityX(0);
    this.playCatAction("jump", true);

    this.tweens.add({
      targets: this.cat,
      y: this.cat.y + 3,
      duration: 190,
      yoyo: true,
      ease: "Sine.easeInOut",
      onComplete: () => {
        if (!this.cat || this.state !== "JUMPING") {
          this.isPreparingJump = false;
          return;
        }

        const distance = (this.jumpLandingX ?? this.cat.x) - this.cat.x;
        const direction = distance >= 0 ? 1 : -1;
        const horizontalSpeed = Phaser.Math.Clamp(Math.abs(distance) / 1.05, 95, 150);
        this.cat.setFlipX(direction < 0);
        this.cat.setVelocityX(direction * horizontalSpeed);
        this.cat.setVelocityY(-360);
        this.jumpStartedAt = this.time.now;
        this.isPreparingJump = false;
        this.playCatAction("jump", true);
      },
    });
  }

  private updateJumpState(time: number) {
    if (!this.cat) {
      return;
    }

    this.playCatAction("jump");

    if (this.isPreparingJump) {
      this.cat.setVelocityX(0);
      return;
    }

    if (this.jumpLandingX !== undefined && this.jumpTakeoffX !== undefined) {
      const distance = this.jumpLandingX - this.cat.x;
      const travel = Math.abs(this.jumpLandingX - this.jumpTakeoffX);
      const progress = Phaser.Math.Clamp(Math.abs(this.cat.x - this.jumpTakeoffX) / Math.max(1, travel), 0, 1);
      if (Math.abs(distance) < 12 || progress > 0.92) {
        this.cat.setVelocityX(0);
      } else if (this.cat.body.velocity.y > 40) {
        const speed = Phaser.Math.Clamp(Math.abs(distance) / 0.65, 55, 120);
        this.cat.setVelocityX(distance > 0 ? speed : -speed);
      }
    }

    const hasBeenAirborne = time - this.jumpStartedAt > 260;
    if (hasBeenAirborne && this.cat.body.blocked.down) {
      this.cat.setVelocityX(0);
      this.cat.setVelocityY(0);
      this.jumpLandingX = undefined;
      this.jumpTakeoffX = undefined;
      this.state = "IDLE";
      this.nextDecisionAt = time + Phaser.Math.Between(900, 1800);
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
        frameRate: config.frameRate,
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
