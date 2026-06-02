import { useMemo, useState } from "react";
import {
  countUnreadDeliveredLetters,
  getMailboxLetters,
  isFinalLetter,
  renderLetterContent,
  type MailboxLetter,
} from "../domain/letters";
import { formatNextDeliveryHint } from "../domain/time";
import type { ICatPassport } from "../types";

interface MailboxProps {
  passport: ICatPassport;
  onReadLetter: (letterId: number) => void;
  onCompleteFarewell: () => void;
}

export default function Mailbox({ passport, onReadLetter, onCompleteFarewell }: MailboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<MailboxLetter | null>(null);
  const mailboxItems = useMemo(() => getMailboxLetters(passport), [passport]);
  const unreadCount = useMemo(() => countUnreadDeliveredLetters(passport), [passport]);
  const nextHint = useMemo(() => formatNextDeliveryHint(passport.createdAt), [passport.createdAt]);

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
        className={`flex min-h-20 w-full items-center justify-between border-4 border-[#4A3E3D] px-4 py-3 text-left shadow-[4px_4px_0px_0px_#4A3E3D] ${
          passport.isFarewellCompleted ? "bg-[#EFE8F6]" : "bg-[#FFFDF9]"
        }`}
      >
        <span>
          <span className="block text-sm font-bold text-[#8D6E63]">时光信箱</span>
          <span className="block text-xl font-black">
            {passport.isFarewellCompleted ? "星河封存" : "打开来信"}
          </span>
        </span>
        <span className="grid h-10 min-w-10 place-items-center border-4 border-[#4A3E3D] bg-[#F3D8C7] px-2 text-lg font-black">
          {unreadCount}
        </span>
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#2A2321]/50 px-4 py-6">
          <section className="max-h-[90dvh] w-full max-w-2xl overflow-auto border-4 border-[#4A3E3D] bg-[#FBF8F3] p-5 shadow-[6px_6px_0_#4A3E3D]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A98D85]">Mailbox</p>
                <h2 className="mt-1 text-3xl font-black">时光信箱</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setSelected(null);
                }}
                className="border-4 border-[#4A3E3D] bg-white px-3 py-2 font-black shadow-[3px_3px_0_#4A3E3D]"
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
                  className={`border-4 border-[#4A3E3D] p-4 text-left shadow-[3px_3px_0_#4A3E3D] ${
                    item.state === "final-waiting"
                      ? "cursor-not-allowed bg-[#ECE5DE] text-[#7B6662]"
                      : item.isRead
                        ? "bg-white"
                        : "bg-[#F3D8C7]"
                  }`}
                >
                  <span className="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-[#8D6E63]">
                    第 {item.letter.id} 封
                  </span>
                  <span className="block text-lg font-black">{item.title}</span>
                  <span className="mt-1 block text-sm text-[#7B6662]">{item.subtitle}</span>
                </button>
              ))}
              <p className="border-2 border-dashed border-[#BCAAA4] px-4 py-3 text-sm leading-6 text-[#7B6662]">
                {passport.isFarewellCompleted
                  ? "这是小猫留下的最后一封信，信箱已化作璀璨星河。"
                  : nextHint}
              </p>
            </div>
          </section>
        </div>
      ) : null}

      {selected ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-[#2A2321]/60 px-4 py-6">
          <article className="max-h-[90dvh] w-full max-w-xl overflow-auto border-4 border-[#4A3E3D] bg-[#FFFDF9] p-6 shadow-[6px_6px_0_#4A3E3D]">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A98D85]">
              Letter {selected.letter.id}
            </p>
            <h2 className="mt-2 text-3xl font-black">{selected.letter.title}</h2>
            <p className="mt-6 whitespace-pre-wrap text-lg leading-9 text-[#5F504D]">
              {renderLetterContent(selected.letter, passport)}
            </p>

            {isFinalLetter(selected.letter) && !passport.isFarewellCompleted ? (
              <div className="mt-7 border-4 border-[#4A3E3D] bg-[#FBF8F3] p-4">
                <p className="text-base leading-7 text-[#6C5A57]">
                  如果你已经读到这里，可以把这段旅程轻轻收好。以后信箱会进入星河陪伴，所有来信仍然可以回看。
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onCompleteFarewell();
                    closeModal();
                  }}
                  className="mt-4 w-full border-4 border-[#4A3E3D] bg-[#4A3E3D] px-4 py-3 font-black text-[#FFFDF9] shadow-[4px_4px_0_#C9A08B]"
                >
                  谢谢你陪我走到这里
                </button>
              </div>
            ) : null}

            <button
              type="button"
              onClick={closeModal}
              className="mt-6 w-full border-4 border-[#4A3E3D] bg-white px-4 py-3 font-black shadow-[4px_4px_0_#4A3E3D]"
            >
              回到信箱
            </button>
          </article>
        </div>
      ) : null}
    </>
  );
}
