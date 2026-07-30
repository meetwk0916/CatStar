import { useState } from "react";
import type { CatCoatPreset, CatTemperament } from "../types";
import { createPassport, type PassportInput } from "../storage/passportStorage";

const COAT_PRESETS: Array<{ value: CatCoatPreset; label: string; swatch: string }> = [
  { value: "ORANGE_TABBY", label: "橘色虎斑", swatch: "repeating-linear-gradient(135deg,#E89F71 0 7px,#B96F45 7px 9px)" },
  { value: "SOLID_BLACK", label: "纯黑", swatch: "#3A3A3C" },
  { value: "SOLID_WHITE", label: "纯白", swatch: "#F2F2F7" },
  { value: "CALICO", label: "三花", swatch: "linear-gradient(135deg,#E89F71 0 40%,#FFFDF9 40% 68%,#3A3A3C 68%)" },
  { value: "TUXEDO", label: "黑白燕尾服", swatch: "linear-gradient(135deg,#2C2C2E 0 55%,#FFFFFF 55%)" },
  { value: "GRAY_WHITE_TABBY", label: "灰白虎斑", swatch: "repeating-linear-gradient(135deg,#747078 0 7px,#4A454D 7px 9px,#F4EEE8 9px 15px)" },
];

const TEMPERAMENTS: Array<{ value: CatTemperament; label: string; helper: string }> = [
  { value: "AFFECTIONATE", label: "亲近温柔", helper: "更常靠近和回应" },
  { value: "QUIET", label: "安静慢热", helper: "喜欢看窗和安静趴着" },
  { value: "CURIOUS", label: "好奇观察", helper: "喜欢闻闻看看" },
  { value: "LIVELY", label: "活泼灵巧", helper: "更常走动和伸展" },
];

interface OnboardingFormProps {
  onCreate: (passport: ReturnType<typeof createPassport>) => void;
}

export default function OnboardingForm({ onCreate }: OnboardingFormProps) {
  const [form, setForm] = useState<PassportInput>({
    catName: "",
    ownerName: "",
    coatPreset: "GRAY_WHITE_TABBY",
    temperament: "AFFECTIONATE",
    favoriteSnack: "",
    passedDate: "",
  });
  const [error, setError] = useState("");

  const update = <K extends keyof PassportInput>(key: K, value: PassportInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.catName.trim() || !form.ownerName.trim() || !form.favoriteSnack.trim()) {
      setError("请先把小猫名字、家人称呼和喜欢的零食写好。");
      return;
    }

    setError("");
    onCreate(createPassport(form));
  };

  return (
    <main className="min-h-[100dvh] bg-[#FBF8F3] px-5 py-8 text-[#4A3E3D]">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <section className="space-y-5">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8D6E63]">
            Letters from Cat Star
          </p>
          <h1 className="max-w-[9ch] text-5xl font-black leading-[0.96] md:text-7xl">
            喵星来信
          </h1>
          <p className="max-w-[34rem] text-lg leading-8 text-[#6C5A57]">
            为一只已经离开的真实小猫登记一张喵星护照。第一封信会立刻抵达，之后的信会在每天早上 8 点慢慢落进时光信箱。
          </p>
        </section>

        <form
          onSubmit={submit}
          className="border-4 border-[#4A3E3D] bg-[#FFFDF9] p-5 shadow-[4px_4px_0px_0px_#4A3E3D] md:p-7"
        >
          <div className="grid gap-5">
            <label className="grid gap-2">
              <span className="text-sm font-bold">小猫叫什么名字？</span>
              <input
                value={form.catName}
                onChange={(event) => update("catName", event.target.value)}
                className="border-4 border-[#4A3E3D] bg-[#FBF8F3] px-3 py-3 text-base outline-none focus:bg-white"
                maxLength={24}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold">你希望小猫怎么称呼你？</span>
              <input
                value={form.ownerName}
                onChange={(event) => update("ownerName", event.target.value)}
                className="border-4 border-[#4A3E3D] bg-[#FBF8F3] px-3 py-3 text-base outline-none focus:bg-white"
                maxLength={24}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold">它最喜欢的零食</span>
              <input
                value={form.favoriteSnack}
                onChange={(event) => update("favoriteSnack", event.target.value)}
                className="border-4 border-[#4A3E3D] bg-[#FBF8F3] px-3 py-3 text-base outline-none focus:bg-white"
                maxLength={24}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold">离世日期</span>
              <input
                type="date"
                value={form.passedDate}
                onChange={(event) => update("passedDate", event.target.value)}
                className="border-4 border-[#4A3E3D] bg-[#FBF8F3] px-3 py-3 text-base outline-none focus:bg-white"
              />
            </label>

            <fieldset className="grid gap-3">
              <legend className="text-sm font-bold">毛色预设</legend>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {COAT_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => update("coatPreset", preset.value)}
                    aria-pressed={form.coatPreset === preset.value}
                    className={`border-4 px-3 py-3 text-left text-sm font-bold shadow-[3px_3px_0px_0px_#4A3E3D] ${
                      form.coatPreset === preset.value
                        ? "border-[#4A3E3D] bg-[#F3D8C7]"
                        : "border-[#BCAAA4] bg-white"
                    }`}
                  >
                    <span
                      className="mb-2 block h-5 w-5 border-2 border-[#4A3E3D]"
                      style={{ background: preset.swatch }}
                    />
                    {preset.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="grid gap-3">
              <legend className="text-sm font-bold">性格</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {TEMPERAMENTS.map((temperament) => (
                  <button
                    key={temperament.value}
                    type="button"
                    onClick={() => update("temperament", temperament.value)}
                    aria-pressed={form.temperament === temperament.value}
                    className={`border-4 p-3 text-left shadow-[3px_3px_0px_0px_#4A3E3D] ${
                      form.temperament === temperament.value
                        ? "border-[#4A3E3D] bg-[#F3D8C7]"
                        : "border-[#BCAAA4] bg-white"
                    }`}
                  >
                    <span className="block font-bold">{temperament.label}</span>
                    <span className="text-sm text-[#7B6662]">{temperament.helper}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            {error ? (
              <p role="alert" className="border-2 border-[#C46B5C] bg-[#FFF2EF] p-3 text-sm">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              className="border-4 border-[#4A3E3D] bg-[#4A3E3D] px-5 py-4 text-base font-black text-[#FFFDF9] shadow-[4px_4px_0px_0px_#C9A08B] transition-transform hover:-translate-y-0.5"
            >
              登记喵星护照
            </button>

            <p className="text-sm leading-6 text-[#7B6662]">
              当前版本会把小猫护照和信件阅读记录保存在这台设备上。
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
