import { useState } from "react";
import CatScene from "./components/CatScene";
import Mailbox from "./components/Mailbox";
import OnboardingForm from "./components/OnboardingForm";
import { getDeliveryTimeAtIndex } from "./domain/time";
import {
  clearPassport,
  completeFarewell,
  loadPassport,
  markLetterRead,
  savePassport,
} from "./storage/passportStorage";
import type { ICatPassport } from "./types";

export default function App() {
  const [passport, setPassport] = useState<ICatPassport | null>(() => loadPassport());
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [previewNow, setPreviewNow] = useState<number | undefined>(undefined);

  const persistPassport = (nextPassport: ICatPassport) => {
    setPassport(nextPassport);
    savePassport(nextPassport);
  };

  if (!passport) {
    return <OnboardingForm onCreate={persistPassport} />;
  }

  const handleReadLetter = (letterId: number) => {
    persistPassport(markLetterRead(passport, letterId));
  };

  const handleCompleteFarewell = () => {
    persistPassport(completeFarewell(passport));
  };

  const handleReset = () => {
    clearPassport();
    setPassport(null);
    setShowResetConfirm(false);
  };

  return (
    <main className="min-h-[100dvh] bg-[#FBF8F3] px-5 py-6 text-[#4A3E3D]">
      <div className="mx-auto grid max-w-6xl gap-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#A98D85]">
              Letters from Cat Star
            </p>
            <h1 className="mt-1 text-4xl font-black md:text-6xl">喵星来信</h1>
          </div>
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="border-4 border-[#4A3E3D] bg-[#FFFDF9] px-4 py-3 text-sm font-black shadow-[4px_4px_0_#4A3E3D]"
          >
            重新登记
          </button>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <CatScene passport={passport} />

          <aside className="grid content-start gap-4">
            {import.meta.env.DEV ? (
              <section className="border-4 border-[#4A3E3D] bg-[#EFE8F6] p-4 shadow-[4px_4px_0_#4A3E3D]">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8D6E63]">
                  Dev Time Preview
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <button
                    type="button"
                    onClick={() => setPreviewNow(undefined)}
                    className="border-2 border-[#4A3E3D] bg-white px-3 py-2 font-black"
                  >
                    真实时间
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewNow(getDeliveryTimeAtIndex(passport.createdAt, 1) + 60_000)}
                    className="border-2 border-[#4A3E3D] bg-white px-3 py-2 font-black"
                  >
                    第2天 8点后
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewNow(getDeliveryTimeAtIndex(passport.createdAt, 2) + 60_000)}
                    className="border-2 border-[#4A3E3D] bg-white px-3 py-2 font-black"
                  >
                    第3天 8点后
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewNow(getDeliveryTimeAtIndex(passport.createdAt, 7) + 60_000)}
                    className="border-2 border-[#4A3E3D] bg-white px-3 py-2 font-black"
                  >
                    最终信投递日
                  </button>
                </div>
                <p className="mt-3 text-xs leading-5 text-[#6C5A57]">
                  {previewNow ? `当前预览：${new Date(previewNow).toLocaleString()}` : "当前预览：真实设备时间"}
                </p>
              </section>
            ) : null}

            <div className="border-4 border-[#4A3E3D] bg-[#FFFDF9] p-5 shadow-[4px_4px_0_#4A3E3D]">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A98D85]">Passport</p>
              <h2 className="mt-2 text-3xl font-black">{passport.catName}</h2>
              <dl className="mt-5 grid gap-3 text-sm">
                <div className="flex justify-between gap-4 border-t-2 border-[#E5D8D0] pt-3">
                  <dt className="font-bold text-[#8D6E63]">家人称呼</dt>
                  <dd>{passport.ownerName}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t-2 border-[#E5D8D0] pt-3">
                  <dt className="font-bold text-[#8D6E63]">喜欢的零食</dt>
                  <dd>{passport.favoriteSnack}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t-2 border-[#E5D8D0] pt-3">
                  <dt className="font-bold text-[#8D6E63]">离世日期</dt>
                  <dd>{passport.passedDate || "没有填写"}</dd>
                </div>
              </dl>
            </div>

            <Mailbox
              passport={passport}
              now={previewNow}
              onReadLetter={handleReadLetter}
              onCompleteFarewell={handleCompleteFarewell}
            />
          </aside>
        </section>
      </div>

      {showResetConfirm ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#2A2321]/50 px-4">
          <section className="w-full max-w-md border-4 border-[#4A3E3D] bg-[#FFFDF9] p-6 shadow-[6px_6px_0_#4A3E3D]">
            <h2 className="text-2xl font-black">重新登记</h2>
            <p className="mt-3 leading-7 text-[#6C5A57]">
              这会清除当前护照和信件阅读记录，然后回到登记页。已经读过的信也会从这台设备上移除。
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="border-4 border-[#4A3E3D] bg-white px-4 py-3 font-black shadow-[4px_4px_0_#4A3E3D]"
              >
                先不重新登记
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="border-4 border-[#4A3E3D] bg-[#4A3E3D] px-4 py-3 font-black text-[#FFFDF9] shadow-[4px_4px_0_#C9A08B]"
              >
                重新登记
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
