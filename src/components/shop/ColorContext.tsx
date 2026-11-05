"use client";
import { createContext, useContext, useState } from "react";

/** Shares the chosen colour between the photo gallery and the size picker on the product page. */
const Ctx = createContext<{ color: string | null; setColor: (c: string | null) => void }>({ color: null, setColor: () => {} });

export function ColorProvider({ initial, children }: { initial: string | null; children: React.ReactNode }) {
  const [color, setColor] = useState<string | null>(initial);
  return <Ctx.Provider value={{ color, setColor }}>{children}</Ctx.Provider>;
}
export const useColor = () => useContext(Ctx);
