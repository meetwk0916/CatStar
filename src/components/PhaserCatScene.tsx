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

type CollisionConfig = Record<string, CollisionRect>;

const SCENE_ASSET_ROOT = "/assets/scenes/window-room";

const PERSONALITY_SPEED: Record<CatPersonality, number> = {
  GLUTTON: 54,
  ALOOFS: 42,
  CLINGY: 50,
  ENERGY: 72,
};

const PALETTE_TINTS: Partial<Record<CatPalette, number>> = {
  ORANGE: 0xffc28e,
  BLACK: 0xb8b4c0,
  WHITE: 0xffffff,
  CALICO: 0xffe2b8,
  TUXEDO: 0xf5f5ff,
};

class CatRoomScene extends Phaser.Scene {
  private cat?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private targetX = 260;
  private nextDecisionAt = 0;
  private state: CatFsmState = "IDLE";
  private showStardust = false;
  private personality: CatPersonality = "CLINGY";
  private palette: CatPalette = "ORANGE";
  private onInteract: (message: string) => void = () => {};

  constructor() {
    super("cat-room");
  }

  init(data: PhaserCatSceneProps) {
    this.palette = data.palette;
    this.personality = data.personality;
    this.showStardust = data.showStardust;
    this.onInteract = data.onInteract;
  }

  preload() {
    this.load.image("window-room-background", `${SCENE_ASSET_ROOT}/background.png`);
    this.load.image("cat-idle-asset", `${SCENE_ASSET_ROOT}/cat/idle.png`);
    this.load.json("window-room-collision", `${SCENE_ASSET_ROOT}/collision.json`);
  }

  create() {
    this.physics.world.setBounds(0, 0, 640, 360);
    this.createPhysicsTexture();
    this.createParticleTexture();
    this.add.image(320, 180, "window-room-background").setDisplaySize(640, 360).setDepth(0);
    this.createSceneObjects();
    this.createCat();
  }

  update(time: number) {
    if (!this.cat) {
      return;
    }

    if (time >= this.nextDecisionAt) {
      this.chooseNextMove(time);
    }

    const distance = this.targetX - this.cat.x;
    if (this.state === "SLEEPING" || this.state === "EATING") {
      this.cat.setVelocityX(0);
      return;
    }

    if (Math.abs(distance) < 8 || this.state === "IDLE") {
      this.cat.setVelocityX(0);
      return;
    }

    const speed = PERSONALITY_SPEED[this.personality];
    this.cat.setVelocityX(distance > 0 ? speed : -speed);
    this.cat.setFlipX(distance < 0);
  }

  private createSceneObjects() {
    const collision = this.cache.json.get("window-room-collision") as CollisionConfig;
    const colliders = Object.entries(collision).map(([name, rect]) =>
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
    this.cat = this.physics.add.sprite(320, 120, "cat-idle-asset");
    this.cat.setDisplaySize(88, 97);
    this.cat.setTint(PALETTE_TINTS[this.palette] ?? 0xffffff);
    this.cat.setCollideWorldBounds(true);
    this.cat.setGravityY(620);
    this.cat.setBounce(0.08);
    this.cat.setDepth(5);
    this.cat.setInteractive({ useHandCursor: true });
    this.cat.on("pointerdown", () => this.interact());

    // Body values are in source texture pixels; display size scales them to scene pixels.
    this.cat.setSize(420, 570);
    this.cat.setOffset(120, 95);

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

    if (this.state === "WALKING" || this.state === "JUMPING") {
      this.targetX = Phaser.Math.Between(120, 520);
    }

    if (this.state === "JUMPING" && this.cat?.body.blocked.down) {
      this.cat.setVelocityY(-360);
    }
  }

  private interact() {
    if (!this.cat) {
      return;
    }

    this.cat.setVelocityY(-250);
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
