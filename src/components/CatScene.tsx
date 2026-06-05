import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { motion } from "motion/react";
import type { ICatPassport } from "../types";

const PhaserCatScene = lazy(() => import("./PhaserCatScene"));

interface CatSceneProps {
  passport: ICatPassport;
}

export default function CatScene({ passport }: CatSceneProps) {
  const [reaction, setReaction] = useState("");

  const sceneCaption = useMemo(() => {
    if (passport.isFarewellCompleted) {
      return `${passport.catName} 还在喵星的星河边，和平常一样慢慢走、慢慢睡。`;
    }

    return `${passport.catName} 正在喵星的小岛上等下一封信抵达。`;
  }, [passport.catName, passport.isFarewellCompleted]);

  const showReaction = useCallback((message: string) => {
    setReaction(message);
    window.setTimeout(() => {
      setReaction("");
    }, 3000);
  }, []);

  return (
    <section className="grid gap-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A98D85]">Cat Star Window</p>
          <h2 className="mt-1 text-2xl font-black">星光窗边</h2>
        </div>
        <p className="max-w-[13rem] text-right text-sm leading-6 text-[#786662]">{sceneCaption}</p>
      </div>

      <div className="relative aspect-[16/9] min-h-72 overflow-hidden border-4 border-[#4A3E3D] bg-[#202433] shadow-[4px_4px_0px_0px_#4A3E3D]">
        <Suspense fallback={<div className="grid h-full place-items-center text-sm font-black text-[#FFFDF9]">星光正在铺好</div>}>
          <PhaserCatScene
            palette={passport.colorPalette}
            personality={passport.personality}
            showStardust={passport.isFarewellCompleted}
            onInteract={showReaction}
          />
        </Suspense>
        {reaction ? (
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="pointer-events-none absolute left-1/2 top-5 w-max max-w-56 -translate-x-1/2 border-4 border-[#4A3E3D] bg-[#FFFDF9] px-3 py-2 text-sm font-bold text-[#4A3E3D] shadow-[3px_3px_0_#4A3E3D]"
          >
            {reaction}
          </motion.span>
        ) : null}
      </div>
    </section>
  );
}
