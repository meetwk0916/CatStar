import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { getCompanionReaction } from "../domain/catFsm";
import { getDeliveredLetters, isFinalLetter } from "../domain/letters";
import type { ICatPassport } from "../types";

const PhaserCatScene = lazy(() => import("./PhaserCatScene"));

interface CatSceneProps {
  passport: ICatPassport;
  now?: number;
}

export default function CatScene({ passport, now }: CatSceneProps) {
  const [reaction, setReaction] = useState("");
  const [interactionSignal, setInteractionSignal] = useState(0);

  const sceneCaption = useMemo(() => {
    if (passport.isFarewellCompleted) {
      return `${passport.catName} 还在喵星的星河边，和平常一样慢慢走、慢慢睡。`;
    }
    if (getDeliveredLetters(passport, now).some(isFinalLetter)) {
      return `${passport.catName} 正在窗边陪你，已经抵达的信都可以慢慢读。`;
    }

    return `${passport.catName} 正在喵星的小岛上等下一封信抵达。`;
  }, [now, passport]);

  const showReaction = useCallback((message: string | null) => {
    if (!message) {
      setReaction("");
      return;
    }
    setReaction(message);
    window.setTimeout(() => {
      setReaction("");
    }, 3000);
  }, []);

  const interactWithCat = useCallback(() => {
    showReaction(getCompanionReaction("INTERACTING"));
    setInteractionSignal((current) => current + 1);
  }, [showReaction]);

  return (
    <section className="grid min-w-0 gap-4">
      <div className="grid gap-2 sm:flex sm:items-end sm:justify-between sm:gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A98D85]">Cat Star Window</p>
          <h2 className="mt-1 text-2xl font-black">星光窗边</h2>
        </div>
        <p className="max-w-[18rem] text-left text-sm leading-6 text-[#786662] sm:max-w-[13rem] sm:text-right">
          {sceneCaption}
        </p>
      </div>

      <div className="relative aspect-[16/9] min-h-0 min-w-0 overflow-hidden border-4 border-[#4A3E3D] bg-[#202433] shadow-[4px_4px_0px_0px_#4A3E3D] md:min-h-72">
        <Suspense fallback={<div className="grid h-full place-items-center text-sm font-black text-[#FFFDF9]">星光正在铺好</div>}>
          <PhaserCatScene
            coatPreset={passport.coatPreset}
            temperament={passport.temperament}
            showStardust={passport.isFarewellCompleted}
            onInteract={showReaction}
            interactionSignal={interactionSignal}
          />
        </Suspense>
        {reaction ? (
          <span
            role="status"
            aria-live="polite"
            className="cat-reaction pointer-events-none absolute left-1/2 top-5 w-max max-w-56 -translate-x-1/2 border-4 border-[#4A3E3D] bg-[#FFFDF9] px-3 py-2 text-sm font-bold text-[#4A3E3D] shadow-[3px_3px_0_#4A3E3D]"
          >
            {reaction}
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[#786662]">
        <span>也可以用按钮回应窗边的小猫。</span>
        <button
          type="button"
          onClick={interactWithCat}
          className="border-2 border-[#4A3E3D] bg-[#FFFDF9] px-3 py-2 font-black shadow-[3px_3px_0_#4A3E3D]"
        >
          轻轻摸摸{passport.catName}
        </button>
      </div>
    </section>
  );
}
