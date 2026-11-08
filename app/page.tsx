"use client";

import { useEffect, useState } from "react";
import App from "../src/App";

export default function Home() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-[#FBF8F3] px-5 text-[#4A3E3D]">
        <p className="rounded-2xl border border-[#CDBCA9] bg-[#FFFDF9] px-5 py-4 font-semibold shadow-[0_8px_24px_#6C514510]">
          星光正在铺好
        </p>
      </main>
    );
  }

  return <App />;
}
