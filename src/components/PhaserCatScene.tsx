import { useCallback, useEffect, useRef } from "react";
import * as Phaser from "phaser";
import { CatRoomScene, type CatRoomSceneData } from "../game/CatRoomScene";
import { PendingInteractionQueue } from "./pendingInteractions";

interface PhaserCatSceneProps extends Omit<CatRoomSceneData, "onReady"> {
  interactionSignal?: number;
}

export default function PhaserCatScene(props: PhaserCatSceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneReadyRef = useRef(false);
  const interactionQueueRef = useRef<PendingInteractionQueue | null>(null);
  const lastInteractionSignalRef = useRef(0);
  if (!interactionQueueRef.current) {
    interactionQueueRef.current = new PendingInteractionQueue();
  }

  const flushPendingInteractions = useCallback(() => {
    const scene = gameRef.current?.scene.getScene("cat-room");
    if (!(scene instanceof CatRoomScene)) {
      return;
    }

    interactionQueueRef.current?.flush(
      sceneReadyRef.current,
      () => scene.interact(),
    );
  }, []);

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
    sceneReadyRef.current = false;

    game.scene.start("cat-room", {
      coatPreset: props.coatPreset,
      temperament: props.temperament,
      showStardust: props.showStardust,
      onInteract: props.onInteract,
      onReady: () => {
        sceneReadyRef.current = true;
        flushPendingInteractions();
      },
    });

    return () => {
      sceneReadyRef.current = false;
      interactionQueueRef.current?.pause();
      game.destroy(true);
      if (gameRef.current === game) {
        gameRef.current = null;
      }
    };
  }, [
    flushPendingInteractions,
    props.coatPreset,
    props.temperament,
    props.showStardust,
    props.onInteract,
  ]);

  useEffect(() => {
    const signal = props.interactionSignal ?? 0;
    interactionQueueRef.current?.enqueue(Math.max(
      0,
      signal - lastInteractionSignalRef.current,
    ));
    lastInteractionSignalRef.current = signal;
    flushPendingInteractions();
  }, [flushPendingInteractions, props.interactionSignal]);

  return <div ref={containerRef} className="h-full w-full" />;
}
