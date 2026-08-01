import { useCallback, useEffect, useRef } from "react";
import * as Phaser from "phaser";
import { CatRoomScene, type CatRoomSceneData } from "../game/CatRoomScene";
import { deliverInteractionSignal } from "./interactionSignal";

interface PhaserCatSceneProps extends Omit<CatRoomSceneData, "initialInteractionCount" | "onReady"> {
  interactionSignal?: number;
}

export default function PhaserCatScene(props: PhaserCatSceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const lastInteractionSignalRef = useRef(0);
  const latestInteractionSignalRef = useRef(props.interactionSignal ?? 0);
  latestInteractionSignalRef.current = props.interactionSignal ?? 0;

  const deliverPendingInteractions = useCallback((readyScene?: CatRoomScene) => {
    const interactionSignal = latestInteractionSignalRef.current;
    const scene = readyScene ?? gameRef.current?.scene.getScene("cat-room");
    if (scene instanceof CatRoomScene) {
      lastInteractionSignalRef.current = deliverInteractionSignal(
        lastInteractionSignalRef.current,
        interactionSignal,
        (count) => scene.enqueueInteractions(count),
      );
    }
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
      onReady: deliverPendingInteractions,
    });

    return () => {
      game.destroy(true);
      if (gameRef.current === game) {
        gameRef.current = null;
      }
    };
  }, [
    deliverPendingInteractions,
    props.coatPreset,
    props.temperament,
    props.showStardust,
    props.onInteract,
  ]);

  useEffect(() => {
    deliverPendingInteractions();
  }, [deliverPendingInteractions, props.interactionSignal]);

  return <div ref={containerRef} className="h-full w-full" />;
}
