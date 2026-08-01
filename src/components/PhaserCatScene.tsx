import { useEffect, useRef } from "react";
import * as Phaser from "phaser";
import { CatRoomScene, type CatRoomSceneData } from "../game/CatRoomScene";

interface PhaserCatSceneProps extends Omit<CatRoomSceneData, "initialInteractionCount"> {
  interactionSignal?: number;
}

export default function PhaserCatScene(props: PhaserCatSceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const lastInteractionSignalRef = useRef(0);
  const latestInteractionSignalRef = useRef(props.interactionSignal ?? 0);
  latestInteractionSignalRef.current = props.interactionSignal ?? 0;

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
    const interactionSignal = latestInteractionSignalRef.current;
    const initialInteractionCount = Math.max(
      0,
      interactionSignal - lastInteractionSignalRef.current,
    );
    lastInteractionSignalRef.current = interactionSignal;

    game.scene.start("cat-room", {
      coatPreset: props.coatPreset,
      temperament: props.temperament,
      showStardust: props.showStardust,
      onInteract: props.onInteract,
      initialInteractionCount,
    });

    return () => {
      game.destroy(true);
      if (gameRef.current === game) {
        gameRef.current = null;
      }
    };
  }, [
    props.coatPreset,
    props.temperament,
    props.showStardust,
    props.onInteract,
  ]);

  useEffect(() => {
    const signal = props.interactionSignal ?? 0;
    const pendingCount = Math.max(0, signal - lastInteractionSignalRef.current);
    const scene = gameRef.current?.scene.getScene("cat-room");
    if (pendingCount > 0 && scene instanceof CatRoomScene) {
      scene.enqueueInteractions(pendingCount);
    }
    lastInteractionSignalRef.current = signal;
  }, [props.interactionSignal]);

  return <div ref={containerRef} className="h-full w-full" />;
}
