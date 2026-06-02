import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { chooseNextState, getCompanionReaction } from "../domain/catFsm";
import type { CatFsmState, ICatPassport } from "../types";
import PixelCatRenderer from "./PixelCatRenderer";

interface Position {
  x: number;
  y: number;
}

interface CatSceneProps {
  passport: ICatPassport;
}

export default function CatScene({ passport }: CatSceneProps) {
  const [state, setState] = useState<CatFsmState>("IDLE");
  const [position, setPosition] = useState<Position>({ x: 130, y: 78 });
  const [direction, setDirection] = useState(1);
  const [reaction, setReaction] = useState("");

  useEffect(() => {
    if (state === "INTERACTING") {
      return;
    }

    const tick = window.setInterval(() => {
      const nextState = chooseNextState(passport.personality);
      setState(nextState);

      if (nextState === "WALKING" || nextState === "JUMPING") {
        setPosition((current) => {
          const next = {
            x: Math.round(24 + Math.random() * 236),
            y: Math.round(34 + Math.random() * 82),
          };
          setDirection(next.x >= current.x ? 1 : -1);
          return next;
        });
      }
    }, 6000);

    return () => window.clearInterval(tick);
  }, [passport.personality, state]);

  const sceneCaption = useMemo(() => {
    if (passport.isFarewellCompleted) {
      return `${passport.catName} 还在喵星的星河边，和平常一样慢慢走、慢慢睡。`;
    }

    return `${passport.catName} 正在喵星的小岛上等下一封信抵达。`;
  }, [passport.catName, passport.isFarewellCompleted]);

  const interact = () => {
    setState("INTERACTING");
    setReaction(getCompanionReaction("INTERACTING"));
    window.setTimeout(() => {
      setReaction("");
      setState("IDLE");
    }, 3000);
  };

  const childY = state === "JUMPING" ? [0, -30, 0] : state === "SLEEPING" ? 8 : 0;
  const rotate = state === "EATING" ? [-2, 2, -2] : 0;

  return (
    <section className="grid gap-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A98D85]">Cat Star Island</p>
          <h2 className="mt-1 text-2xl font-black">璀璨星空岛</h2>
        </div>
        <p className="max-w-[13rem] text-right text-sm leading-6 text-[#786662]">{sceneCaption}</p>
      </div>

      <div className="relative h-64 overflow-hidden border-4 border-[#4A3E3D] bg-[#1F2433] shadow-[4px_4px_0px_0px_#4A3E3D]">
        <div className="absolute inset-0 star-field" />
        <div className="absolute bottom-5 left-1/2 h-28 w-[22rem] max-w-[90%] -translate-x-1/2 rounded-[50%] border-4 border-[#4A3E3D] bg-[#D9E7D0] shadow-[0_18px_0_#A8C49D]" />
        <motion.button
          type="button"
          onClick={interact}
          className="absolute cursor-pointer border-0 bg-transparent p-0"
          aria-label={`轻轻碰碰 ${passport.catName}`}
          animate={{
            x: position.x,
            y: position.y,
            scaleX: direction,
          }}
          transition={{ duration: state === "INTERACTING" ? 0.1 : 3, ease: "easeInOut" }}
        >
          {reaction ? (
            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -top-12 left-1/2 w-max max-w-48 -translate-x-1/2 border-4 border-[#4A3E3D] bg-[#FFFDF9] px-3 py-2 text-sm font-bold text-[#4A3E3D] shadow-[3px_3px_0_#4A3E3D]"
            >
              {reaction}
            </motion.span>
          ) : null}
          <motion.div
            animate={{
              y: childY,
              rotate,
              x: state === "INTERACTING" ? [0, -5, 5, -4, 4, 0] : 0,
            }}
            transition={{ duration: state === "INTERACTING" ? 0.5 : 1.1, repeat: state === "EATING" ? Infinity : 0 }}
          >
            <PixelCatRenderer palette={passport.colorPalette} showStardust={passport.isFarewellCompleted} />
          </motion.div>
        </motion.button>
      </div>
    </section>
  );
}
