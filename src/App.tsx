import { useState } from "react";
import CatScene from "./components/CatScene";
import Mailbox from "./components/Mailbox";
import ModalDialog from "./components/ModalDialog";
import OnboardingForm from "./components/OnboardingForm";
import { getDeliveryTimeAtIndex } from "./domain/time";
import { completeFarewell, markLetterRead } from "./domain/passport";
import { clearPassport, loadPassport, savePassport } from "./storage/passportStorage";
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
      <div className="mx-auto grid max-w-6xl gap-5 md:gap-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#8D6E63]">
              Letters from Cat Star
            </p>
            <h1 className="mt-1 text-3xl font-semibold md:text-5xl">喵星来信</h1>
          </div>
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="rounded-2xl border border-[#CDBCA9] bg-[#FFFDF9] px-4 py-3 text-sm font-semibold shadow-[0_8px_24px_#6C514510]"
          >
            重新登记
          </button>
        </header>

        <section className="grid items-start gap-6 lg:grid-cols-[1.55fr_0.85fr]">
          <CatScene passport={passport} now={previewNow} />

          <aside className="grid content-start gap-4">
            <Mailbox
              passport={passport}
              now={previewNow}
              onReadLetter={handleReadLetter}
              onCompleteFarewell={handleCompleteFarewell}
            />

            <div className="rounded-2xl border border-[#CDBCA9] bg-[#FFFDF9] p-5 shadow-[0_8px_24px_#6C514510]">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8D6E63]">喵星护照</p>
              <h2 className="mt-2 text-3xl font-semibold">{passport.catName}</h2>
              <dl className="mt-5 grid gap-3 text-sm">
                <div className="flex justify-between gap-4 border-t-2 border-[#E5D8D0] pt-3">
                  <dt className="font-bold text-[#8D6E63]">家人称呼</dt>
                  <dd>{passport.ownerName}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t-2 border-[#E5D8D0] pt-3">
                  <dt className="font-bold text-[#8D6E63]">喜欢的零食</dt>
                  <dd>{passport.favoriteSnack}</dd>
                </div>
              </dl>
            </div>

            {import.meta.env.DEV ? (
              <section className="rounded-2xl border border-[#CDBCA9] bg-[#F0E9DD] p-4 shadow-[0_8px_24px_#6C514510]">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8D6E63]">
                  Dev Time Preview
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <button
                    type="button"
                    onClick={() => setPreviewNow(undefined)}
                    className="rounded-xl border border-[#CDBCA9] bg-white px-3 py-2 font-semibold"
                  >
                    真实时间
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewNow(getDeliveryTimeAtIndex(passport.createdAt, 1) + 60_000)}
                    className="rounded-xl border border-[#CDBCA9] bg-white px-3 py-2 font-semibold"
                  >
                    第2天 8点后
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewNow(getDeliveryTimeAtIndex(passport.createdAt, 2) + 60_000)}
                    className="rounded-xl border border-[#CDBCA9] bg-white px-3 py-2 font-semibold"
                  >
                    第3天 8点后
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewNow(getDeliveryTimeAtIndex(passport.createdAt, 7) + 60_000)}
                    className="rounded-xl border border-[#CDBCA9] bg-white px-3 py-2 font-semibold"
                  >
                    最终信投递日
                  </button>
                </div>
                <p className="mt-3 text-xs leading-5 text-[#6C5A57]">
                  {previewNow ? `当前预览：${new Date(previewNow).toLocaleString()}` : "当前预览：真实设备时间"}
                </p>
              </section>
            ) : null}
          </aside>
        </section>
      </div>

      <ModalDialog
        open={showResetConfirm}
        ariaLabel="重新登记"
        onClose={() => setShowResetConfirm(false)}
        overlayClassName="bg-[#3F352C]/35 px-4"
        panelClassName="w-full max-w-md rounded-2xl border border-[#CDBCA9] bg-[#FFFDF9] p-6 shadow-[0_8px_24px_#6C514510]"
      >
            <h2 className="text-2xl font-semibold">重新登记</h2>
            <p className="mt-3 leading-7 text-[#6C5A57]">
              这会清除当前护照和信件阅读记录，然后回到登记页。已经读过的信也会从这台设备上移除。
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="rounded-2xl border border-[#CDBCA9] bg-white px-4 py-3 font-semibold shadow-[0_8px_24px_#6C514510]"
              >
                先不重新登记
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-2xl border border-[#CDBCA9] bg-[#6C5145] px-4 py-3 font-semibold text-[#FFFDF9] shadow-[0_8px_24px_#6C514510]"
              >
                重新登记
              </button>
            </div>
      </ModalDialog>
    </main>
  );
}
