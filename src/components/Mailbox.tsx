import { useMemo, useState } from "react";
import {
  countUnreadDeliveredLetters,
  getMailboxLetters,
  getMailboxStatusHint,
  isFinalLetter,
  renderLetterContent,
  type MailboxLetter,
} from "../domain/letters";
import type { ICatPassport } from "../types";
import ModalDialog from "./ModalDialog";

interface MailboxProps {
  passport: ICatPassport;
  now?: number;
  onReadLetter: (letterId: number) => void;
  onCompleteFarewell: () => void;
}

export default function Mailbox({ passport, now, onReadLetter, onCompleteFarewell }: MailboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<MailboxLetter | null>(null);
  const mailboxItems = useMemo(() => getMailboxLetters(passport, now), [now, passport]);
  const unreadCount = useMemo(() => countUnreadDeliveredLetters(passport, now), [now, passport]);
  const mailboxHint = useMemo(() => getMailboxStatusHint(passport, now), [now, passport]);

  const openLetter = (item: MailboxLetter) => {
    if (item.state !== "readable") {
      return;
    }
    setSelected(item);
    onReadLetter(item.letter.id);
  };

  const closeModal = () => {
    setSelected(null);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`flex min-h-20 w-full items-center justify-between rounded-2xl border border-[#CDBCA9] px-4 py-3 text-left shadow-[0_8px_24px_#6C514510] ${
          passport.isFarewellCompleted ? "bg-[#F0E9DD]" : "bg-[#FFFDF9]"
        }`}
      >
        <span>
          <span className="block text-sm font-bold text-[#8D6E63]">时光信箱</span>
          <span className="block text-xl font-semibold">
            {passport.isFarewellCompleted ? "信箱封存" : "打开来信"}
          </span>
        </span>
        <span className="grid h-10 min-w-10 place-items-center rounded-2xl border border-[#CDBCA9] bg-[#F3E5D5] px-2 text-lg font-semibold">
          {unreadCount}
        </span>
      </button>

      <ModalDialog
        open={isOpen && !selected}
        ariaLabel="时光信箱"
        onClose={() => setIsOpen(false)}
        panelClassName="max-h-[90dvh] w-full max-w-2xl overflow-auto rounded-2xl border border-[#CDBCA9] bg-[#FBF8F3] p-5 shadow-[0_8px_24px_#6C514510]"
      >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8D6E63]">Mailbox</p>
                <h2 className="mt-1 text-3xl font-semibold">时光信箱</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setSelected(null);
                }}
                className="rounded-2xl border border-[#CDBCA9] bg-white px-3 py-2 font-semibold shadow-[0_8px_24px_#6C514510]"
              >
                关闭
              </button>
            </div>

            <div className="grid gap-3">
              {mailboxItems.map((item) => (
                <button
                  key={item.letter.id}
                  type="button"
                  onClick={() => openLetter(item)}
                  disabled={item.state !== "readable"}
                  className={`rounded-2xl border border-[#CDBCA9] p-4 text-left shadow-[0_8px_24px_#6C514510] ${
                    item.state === "final-waiting"
                      ? "cursor-not-allowed bg-[#ECE5DE] text-[#7B6662]"
                      : item.isRead
                        ? "bg-white"
                        : "bg-[#F3E5D5]"
                  }`}
                >
                  <span className="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-[#8D6E63]">
                    {isFinalLetter(item.letter) ? "最后一封" : `第 ${item.letter.id} 封`}
                  </span>
                  <span className="block text-lg font-semibold">{item.title}</span>
                  <span className="mt-1 block text-sm text-[#7B6662]">{item.subtitle}</span>
                </button>
              ))}
              <p className="border-2 border-dashed border-[#BCAAA4] px-4 py-3 text-sm leading-6 text-[#7B6662]">
                {mailboxHint}
              </p>
            </div>
      </ModalDialog>

      <ModalDialog
        open={selected !== null}
        ariaLabel={selected?.letter.title ?? "来信"}
        onClose={closeModal}
        overlayClassName="z-[60] bg-[#3F352C]/35 px-4 py-6"
        panelClassName="max-h-[90dvh] w-full max-w-xl overflow-auto rounded-2xl border border-[#CDBCA9] bg-[#FFFDF9] p-6 shadow-[0_8px_24px_#6C514510]"
      >
          {selected ? (
            <article>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8D6E63]">
              {isFinalLetter(selected.letter) ? "最后一封" : `第 ${selected.letter.id} 封`}
            </p>
            <h2 className="mt-2 text-3xl font-semibold">{selected.letter.title}</h2>
            <p className="mt-6 whitespace-pre-wrap text-lg leading-9 text-[#5F504D]">
              {renderLetterContent(selected.letter, passport)}
            </p>

            {isFinalLetter(selected.letter) && !passport.isFarewellCompleted ? (
              <div className="mt-7 rounded-2xl border border-[#CDBCA9] bg-[#FBF8F3] p-4">
                <p className="text-base leading-7 text-[#6C5A57]">
                  如果你已经读到这里，可以把这段旅程轻轻收好。以后信箱会进入星河陪伴，所有来信仍然可以回看。
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onCompleteFarewell();
                    closeModal();
                  }}
                  className="mt-4 w-full rounded-2xl border border-[#CDBCA9] bg-[#6C5145] px-4 py-3 font-semibold text-[#FFFDF9] shadow-[0_8px_24px_#6C514510]"
                >
                  谢谢你陪我走到这里
                </button>
              </div>
            ) : null}

            <button
              type="button"
              onClick={closeModal}
              className="mt-6 w-full rounded-2xl border border-[#CDBCA9] bg-white px-4 py-3 font-semibold shadow-[0_8px_24px_#6C514510]"
            >
              回到信箱
            </button>
            </article>
          ) : null}
      </ModalDialog>
    </>
  );
}
