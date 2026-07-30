import { useEffect, useRef } from "react";
import * as Phaser from "phaser";
import { CatRoomScene, type CatRoomSceneData } from "../game/CatRoomScene";

interface PhaserCatSceneProps extends CatRoomSceneData {
  interactionSignal?: number;
}

export default function PhaserCatScene(props: PhaserCatSceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

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
    gameRef.current = game;

    game.scene.start("cat-room", props);

    return () => {
      game.destroy(true);
      if (gameRef.current === game) {
        gameRef.current = null;
      }
    };
  }, [props.coatPreset, props.temperament, props.showStardust, props.onInteract]);

  useEffect(() => {
    if (!props.interactionSignal) {
      return;
    }

    const scene = gameRef.current?.scene.getScene("cat-room");
    if (scene instanceof CatRoomScene && scene.scene.isActive()) {
      scene.interact();
    }
  }, [props.interactionSignal]);

  return <div ref={containerRef} className="h-full w-full" />;
}
