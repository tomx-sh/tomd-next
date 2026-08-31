"use client";

import { useSyncExternalStore } from "react";

type LocalizedDateProps = {
  date: string;
  className?: string;
  format?: "long" | "numeric";
};

const emptySubscribe = () => () => {};

function formatNumericDate(value: Date, locale?: string) {
  const parts = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).formatToParts(value);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  const monthFirst =
    parts.findIndex((part) => part.type === "month") <
    parts.findIndex((part) => part.type === "day");

  return monthFirst
    ? `${values.month}/${values.day}/${values.year}`
    : `${values.day}/${values.month}/${values.year}`;
}

export function LocalizedDate({
  date,
  className,
  format = "long",
}: LocalizedDateProps) {
  const value = new Date(date);
  const isBrowser = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  return (
    <time className={className} dateTime={date}>
      {format === "numeric"
        ? formatNumericDate(value, isBrowser ? undefined : "en")
        : value.toLocaleDateString(isBrowser ? undefined : "en", {
            dateStyle: "long",
            timeZone: "UTC",
          })}
    </time>
  );
}
