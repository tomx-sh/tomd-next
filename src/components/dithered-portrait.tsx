"use client";

import { FloydSteinberg } from "react-floyd-steinberg";

export function DitheredPortrait() {
  return (
    <FloydSteinberg
      src="/images/portrait-2.jpg"
      //width={960}
      pixelScale={2}
      alphaBackground={0}
      randomness={0}
      threshold={0.5}
      fit="contain"
      //style={{ width: "100%", height: "auto" }}
      className="absolute inset-0 z-0 size-full"
      light={"oklch(66.288% 0.2272 35.958)"}
      dark={"oklch(0.145 0 0)"}
      //dark={[0.145, 0.145, 0.145]}
    />
  );
}
