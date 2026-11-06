import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { getDeliveredLetters, isFinalLetter } from "../domain/letters";
import { getCatRuntimeAppearance } from "../domain/catAppearance";
import type { ICatPassport } from "../types";

const PhaserCatScene = lazy(() => import("./PhaserCatScene"));

interface CatSceneProps {
  passport: ICatPassport;
  now?: number;
}

export default function CatScene({ passport, now }: CatSceneProps) {
  const [reaction, setReaction] = useState("");
  const [interactionSignal, setInteractionSignal] = useState(0);
  const runtimeAppearance = getCatRuntimeAppearance(passport.coatPreset);

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
    setInteractionSignal((current) => current + 1);
  }, []);

  return (
    <section className="grid min-w-0 gap-4">
      <div className="grid gap-2 sm:flex sm:items-end sm:justify-between sm:gap-4">
        <div>
          <h2 className="mt-1 text-2xl font-semibold">星光窗边</h2>
        </div>
        <p className="max-w-[18rem] text-left text-sm leading-6 text-[#786662] sm:max-w-[13rem] sm:text-right">
          {sceneCaption}
        </p>
      </div>

      <div
        className="relative aspect-[16/9] min-h-0 min-w-0 overflow-hidden rounded-2xl border border-[#CDBCA9] bg-[#202433] shadow-[0_8px_24px_#6C514510] md:min-h-72"
        data-catstar-coat-preset={passport.coatPreset}
        data-catstar-appearance-authority={runtimeAppearance.authority}
        data-catstar-internal-appearance-preview={runtimeAppearance.isInternalPreview || undefined}
      >
        <Suspense fallback={<div className="grid h-full place-items-center text-sm font-semibold text-[#FFFDF9]">星光正在铺好</div>}>
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
            className="cat-reaction pointer-events-none absolute left-1/2 top-5 w-max max-w-56 -translate-x-1/2 rounded-2xl border border-[#CDBCA9] bg-[#FFFDF9] px-3 py-2 text-sm font-bold text-[#4A3E3D] shadow-[0_8px_24px_#6C514510]"
          >
            {reaction}
          </span>
        ) : null}
        {runtimeAppearance.isInternalPreview ? (
          <p className="pointer-events-none absolute bottom-3 left-3 rounded-xl border border-[#CDBCA9] bg-[#FFFDF9E8] px-2 py-1 text-xs font-bold text-[#6C5A57] shadow-[0_8px_24px_#6C514510]">
            当前为内部形象预览，并非 Issue #23 正式发布美术
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 text-sm text-[#786662]">
        <button
          type="button"
          onClick={interactWithCat}
          className="rounded-xl border border-[#CDBCA9] bg-[#FFFDF9] px-3 py-2 font-semibold shadow-[0_8px_24px_#6C514510]"
        >
          轻轻摸摸{passport.catName}
        </button>
      </div>
    </section>
  );
}
