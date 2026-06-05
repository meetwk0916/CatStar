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

interface PaletteConfig {
  primary: number;
  secondary: number;
  belly: number;
  accent: number;
  outline: number;
  eye: number;
}

const PALETTES: Record<CatPalette, PaletteConfig> = {
  ORANGE: {
    primary: 0xd98a4e,
    secondary: 0xb86b38,
    belly: 0xfff1de,
    accent: 0xeca3a3,
    outline: 0x4a3e3d,
    eye: 0x4a3e3d,
  },
  BLACK: {
    primary: 0x343238,
    secondary: 0x211f24,
    belly: 0x4a4750,
    accent: 0xeca3a3,
    outline: 0x17151a,
    eye: 0xffe88a,
  },
  WHITE: {
    primary: 0xf4f1ec,
    secondary: 0xd9d4cc,
    belly: 0xfffdf9,
    accent: 0xeca3a3,
    outline: 0x4a3e3d,
    eye: 0x4a3e3d,
  },
  CALICO: {
    primary: 0xf1e7d8,
    secondary: 0xc97843,
    belly: 0xfffdf9,
    accent: 0xeca3a3,
    outline: 0x4a3e3d,
    eye: 0x4a3e3d,
  },
  TUXEDO: {
    primary: 0x2c2b30,
    secondary: 0x1e1d22,
    belly: 0xfffdf9,
    accent: 0xeca3a3,
    outline: 0x17151a,
    eye: 0xffe88a,
  },
};

const PERSONALITY_SPEED: Record<CatPersonality, number> = {
  GLUTTON: 54,
  ALOOFS: 42,
  CLINGY: 50,
  ENERGY: 72,
};

class CatRoomScene extends Phaser.Scene {
  private cat?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private targetX = 260;
  private nextDecisionAt = 0;
  private state: CatFsmState = "IDLE";
  private showStardust = false;
  private personality: CatPersonality = "CLINGY";
  private palette: PaletteConfig = PALETTES.ORANGE;
  private onInteract: (message: string) => void = () => {};

  constructor() {
    super("cat-room");
  }

  init(data: PhaserCatSceneProps) {
    this.palette = PALETTES[data.palette];
    this.personality = data.personality;
    this.showStardust = data.showStardust;
    this.onInteract = data.onInteract;
  }

  create() {
    this.physics.world.setBounds(0, 0, 640, 360);
    this.createPhysicsTexture();
    this.drawRoom();
    this.createCatTextures();
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
    if (this.state === "SLEEPING") {
      this.cat.setVelocityX(0);
      this.cat.setTexture("cat-idle");
      return;
    }

    if (this.state === "EATING") {
      this.cat.setVelocityX(0);
      this.cat.setTexture("cat-idle");
      return;
    }

    if (Math.abs(distance) < 8 || this.state === "IDLE") {
      this.cat.setVelocityX(0);
      this.cat.setTexture("cat-idle");
      return;
    }

    const speed = PERSONALITY_SPEED[this.personality];
    this.cat.setVelocityX(distance > 0 ? speed : -speed);
    this.cat.setFlipX(distance < 0);
    this.cat.setTexture("cat-walk");
  }

  private drawRoom() {
    this.cameras.main.setBackgroundColor("#202433");

    const g = this.add.graphics();
    g.fillStyle(0x22283b).fillRect(0, 0, 640, 222);
    g.fillStyle(0x8d7d70).fillRect(0, 222, 640, 138);
    g.fillStyle(0x6d5f57).fillRect(0, 222, 640, 10);
    g.fillStyle(0x9f8d7e).fillRect(0, 268, 640, 10);

    g.fillStyle(0x4a3e3d).fillRect(48, 28, 224, 142);
    g.fillStyle(0x111927).fillRect(56, 36, 208, 126);
    g.fillStyle(0x4a3e3d).fillRect(156, 36, 8, 126);
    g.fillStyle(0x4a3e3d).fillRect(56, 96, 208, 8);
    g.fillStyle(0xffe88a).fillRect(214, 54, 22, 22);
    g.fillStyle(0xd9b85e).fillRect(236, 58, 6, 18);

    const stars = [
      [78, 54],
      [114, 78],
      [188, 46],
      [238, 124],
      [96, 136],
    ];
    g.fillStyle(0xfffdf9);
    stars.forEach(([x, y], index) => {
      g.fillRect(x, y, index % 2 === 0 ? 4 : 3, index % 2 === 0 ? 4 : 3);
    });

    g.fillStyle(0x4a3e3d).fillRect(35, 166, 258, 16);
    g.fillStyle(0xd3a66f).fillRect(43, 166, 242, 8);

    g.fillStyle(0x4a3e3d).fillRect(418, 166, 76, 52);
    g.fillStyle(0xd6b99b).fillRect(426, 174, 60, 36);
    g.fillStyle(0x6e9d78).fillRect(446, 128, 24, 46);
    g.fillStyle(0x8ebf8a).fillRect(420, 140, 38, 24);
    g.fillStyle(0x7bad73).fillRect(464, 134, 42, 28);

    g.fillStyle(0x4a3e3d).fillRect(178, 250, 286, 54);
    g.fillStyle(0xb9877c).fillRect(178, 296, 286, 18);
    g.fillStyle(0xe4b6a5).fillRect(188, 258, 266, 36);
    g.fillStyle(0xf1d0c3).fillRect(218, 250, 206, 12);
  }

  private createSceneObjects() {
    const ground = this.physics.add.staticImage(320, 318, "physics-pixel").setSize(640, 84).setVisible(false);
    const cushion = this.physics.add.staticImage(321, 248, "physics-pixel").setSize(266, 18).setVisible(false);
    const plant = this.physics.add.staticImage(456, 168, "physics-pixel").setSize(72, 58).setVisible(false);

    if (this.cat) {
      this.physics.add.collider(this.cat, ground);
      this.physics.add.collider(this.cat, cushion);
      this.physics.add.collider(this.cat, plant);
    }

    this.registry.set("catstar-colliders", { ground, cushion, plant });
  }

  private createCat() {
    this.cat = this.physics.add.sprite(320, 180, "cat-idle");
    this.cat.setScale(2);
    this.cat.setCollideWorldBounds(true);
    this.cat.setGravityY(620);
    this.cat.setBounce(0.08);
    this.cat.setSize(34, 44);
    this.cat.setOffset(13, 18);
    this.cat.setInteractive({ useHandCursor: true });
    this.cat.on("pointerdown", () => this.interact());

    const colliders = this.registry.get("catstar-colliders") as
      | Record<"ground" | "cushion" | "plant", Phaser.Physics.Arcade.Image>
      | undefined;

    if (colliders) {
      this.physics.add.collider(this.cat, colliders.ground);
      this.physics.add.collider(this.cat, colliders.cushion);
      this.physics.add.collider(this.cat, colliders.plant);
    }

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
      this.cat.setTexture("cat-jump");
    }
  }

  private interact() {
    if (!this.cat) {
      return;
    }

    this.cat.setVelocityY(-250);
    this.cat.setTexture("cat-jump");
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

  private createCatTextures() {
    this.createCatTexture("cat-idle", 0);
    this.createCatTexture("cat-walk", 2);
    this.createCatTexture("cat-jump", -3);

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

  private createCatTexture(key: string, pawOffset: number) {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const p = this.palette;

    g.fillStyle(0x000000, 0);
    g.fillRect(0, 0, 64, 64);
    g.fillStyle(p.outline).fillRect(12, 14, 8, 10).fillRect(20, 8, 8, 8);
    g.fillStyle(p.outline).fillRect(42, 8, 8, 8).fillRect(50, 14, 8, 10);
    g.fillStyle(p.outline).fillRect(12, 20, 46, 24).fillRect(18, 16, 34, 32);
    g.fillStyle(p.primary).fillRect(16, 22, 38, 18).fillRect(20, 18, 30, 24);
    g.fillStyle(p.accent).fillRect(22, 16, 4, 5).fillRect(44, 16, 4, 5);

    g.fillStyle(p.outline).fillRect(16, 38, 34, 20).fillRect(10, 44, 46, 12);
    g.fillStyle(p.primary).fillRect(18, 40, 30, 16).fillRect(12, 46, 42, 8);
    g.fillStyle(p.belly).fillRect(26, 42, 14, 16);

    g.fillStyle(p.outline).fillRect(50, 40, 8, 8).fillRect(56, 32, 6, 12).fillRect(58, 26, 4, 8);
    g.fillStyle(p.primary).fillRect(52, 42, 4, 4).fillRect(58, 34, 3, 8);

    g.fillStyle(p.secondary).fillRect(20, 18, 8, 3).fillRect(38, 18, 9, 3).fillRect(48, 44, 6, 3);
    g.fillStyle(p.eye).fillRect(24, 28, 4, 6).fillRect(42, 28, 4, 6);
    g.fillStyle(0xfffdf9, 0.9).fillRect(26, 28, 1, 1).fillRect(44, 28, 1, 1);
    g.fillStyle(p.accent).fillRect(34, 35, 4, 3);
    g.fillStyle(p.outline).fillRect(28, 39, 12, 2);
    g.fillStyle(p.outline).fillRect(16, 34, 9, 1).fillRect(45, 34, 9, 1);

    g.fillStyle(p.outline).fillRect(20, 56 + pawOffset, 10, 5).fillRect(40, 56 - pawOffset, 10, 5);
    g.fillStyle(p.primary).fillRect(22, 56 + pawOffset, 6, 3).fillRect(42, 56 - pawOffset, 6, 3);
    g.generateTexture(key, 64, 64);
    g.destroy();
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
