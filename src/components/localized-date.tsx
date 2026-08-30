"use client";

import { useSyncExternalStore } from "react";

type LocalizedDateProps = {
  date: string;
  className?: string;
};

const emptySubscribe = () => () => {};

export function LocalizedDate({ date, className }: LocalizedDateProps) {
  const value = new Date(date);
  const isBrowser = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  return (
    <time className={className} dateTime={date}>
      {value.toLocaleDateString(isBrowser ? undefined : "en", {
        dateStyle: "long",
        timeZone: "UTC",
      })}
    </time>
  );
}
