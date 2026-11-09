import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { getDeliveredLetters, isFinalLetter } from "../domain/letters";
import { getCatRuntimeAppearance } from "../domain/catAppearance";
import type { TouchDisposition } from "../domain/catFsm";
import type { ICatPassport } from "../types";

const PhaserCatScene = lazy(() => import("./PhaserCatScene"));
const REACTION_ANNOUNCEMENTS: Record<TouchDisposition, string> = {
  "brief-acknowledge": "小猫轻轻转了下头。",
  acknowledge: "小猫转过头，慢慢眨了下眼。",
  "remain-asleep": "小猫在睡梦中轻轻动了一下。",
  wake: "小猫醒来，伸了个懒腰。",
};

interface CatSceneProps {
  passport: ICatPassport;
  now?: number;
  portrait: boolean;
}

export default function CatScene({ passport, now, portrait }: CatSceneProps) {
  const [reaction, setReaction] = useState<{ message: string | null; disposition: TouchDisposition } | null>(null);
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

  const showReaction = useCallback((message: string | null, disposition: TouchDisposition) => {
    setReaction({ message, disposition });
  }, []);

  useEffect(() => {
    if (!reaction) return;
    const timer = window.setTimeout(() => setReaction(null), 3000);
    return () => window.clearTimeout(timer);
  }, [reaction]);

  const interactWithCat = useCallback(() => {
    setInteractionSignal((current) => current + 1);
  }, []);

  return (
    <section className={portrait ? "h-full min-w-0" : "grid min-w-0 gap-4"} aria-label="陪伴场景">
      {!portrait && (
        <div className="grid gap-2 sm:flex sm:items-end sm:justify-between sm:gap-4">
          <div>
            <h2 className="mt-1 text-2xl font-semibold">星光窗边</h2>
          </div>
          <p className="max-w-[18rem] text-left text-sm leading-6 text-[#786662] sm:max-w-[13rem] sm:text-right">
            {sceneCaption}
          </p>
        </div>
      )}

      <div
        className={portrait ? "relative h-full overflow-hidden bg-[#202433]" : "relative aspect-[16/9] min-h-0 min-w-0 overflow-hidden rounded-2xl border border-[#CDBCA9] bg-[#202433] shadow-[0_8px_24px_#6C514510] md:min-h-72"}
        data-catstar-coat-preset={passport.coatPreset}
        data-catstar-appearance-authority={runtimeAppearance.authority}
        data-catstar-internal-appearance-preview={runtimeAppearance.isInternalPreview || undefined}
      >
        <Suspense fallback={<div className="grid h-full place-items-center text-sm font-semibold text-[#FFFDF9]">星光正在铺好</div>}>
          <PhaserCatScene
            coatPreset={passport.coatPreset}
            temperament={passport.temperament}
            showStardust={passport.isFarewellCompleted}
            portrait={portrait}
            onInteract={showReaction}
            interactionSignal={interactionSignal}
          />
        </Suspense>
        <span role="status" className="sr-only">
          {reaction && REACTION_ANNOUNCEMENTS[reaction.disposition]}
          {reaction?.message && ` ${reaction.message}`}
        </span>
        {reaction?.message ? (
          <span
            aria-hidden="true"
            className={`cat-reaction pointer-events-none absolute left-1/2 w-max max-w-56 -translate-x-1/2 rounded-2xl border border-[#CDBCA9] bg-[#FFFDF9] px-3 py-2 text-sm font-bold text-[#4A3E3D] shadow-[0_8px_24px_#6C514510] ${portrait ? "top-[max(1.25rem,env(safe-area-inset-top))]" : "top-5"}`}
          >
            {reaction.message}
          </span>
        ) : null}
        {runtimeAppearance.isInternalPreview ? (
          <p className={`pointer-events-none absolute rounded-xl border border-[#CDBCA9] bg-[#FFFDF9E8] px-2 py-1 text-xs font-bold text-[#6C5A57] shadow-[0_8px_24px_#6C514510] ${portrait ? "bottom-22 left-1/2 w-max max-w-[90%] -translate-x-1/2" : "bottom-3 left-3"}`}>
            当前为内部形象预览，并非 Issue #23 正式发布美术
          </p>
        ) : null}
      </div>

      <div className={portrait ? "absolute inset-x-0 bottom-5 flex justify-center" : "flex flex-wrap items-center justify-end gap-3 text-sm text-[#786662]"}>
        <button
          type="button"
          onClick={interactWithCat}
          className={`rounded-xl border border-[#CDBCA9] bg-[#FFFDF9] px-3 py-2 font-semibold shadow-[0_8px_24px_#6C514510] ${portrait ? "sr-only focus:not-sr-only" : ""}`}
        >
          轻轻摸摸{passport.catName}
        </button>
      </div>
    </section>
  );
}
