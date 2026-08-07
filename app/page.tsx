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
        <p className="border-4 border-[#4A3E3D] bg-[#FFFDF9] px-5 py-4 font-black shadow-[4px_4px_0_#4A3E3D]">
          星光正在铺好
        </p>
      </main>
    );
  }

  return <App />;
}
