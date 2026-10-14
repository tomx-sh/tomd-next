"use client";

import type { Terminal } from "@xterm/xterm";
import type { FxTerminal } from "libfx/wasm";
import { useEffect, useRef, useState } from "react";
import { CHAT_MODEL } from "@/lib/chat";
import "@xterm/xterm/css/xterm.css";

export function ChatTerminal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<string | null>("Loading terminal…");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let terminal: Terminal | undefined;
    let runtime: FxTerminal | undefined;
    let observer: ResizeObserver | undefined;

    async function start() {
      const fx = await import("libfx/wasm");
      if (disposed) return;
      if (!fx.supportsJspi()) {
        setStatus(
          "This terminal requires WebAssembly JSPI. Open this page in a current version of Chrome or Edge.",
        );
        return;
      }

      const [{ Terminal }, { FitAddon }] = await Promise.all([
        import("@xterm/xterm"),
        import("@xterm/addon-fit"),
      ]);
      await document.fonts.ready;
      if (disposed || !container) return;

      terminal = new Terminal({
        cursorBlink: true,
        fontFamily: "monospace",
        fontSize: 14,
        theme: { background: "#000000", foreground: "#ffffff" },
      });
      const fit = new FitAddon();
      terminal.loadAddon(fit);
      terminal.open(container);
      fit.fit();
      observer = new ResizeObserver(() => fit.fit());
      observer.observe(container);

      runtime = await fx.createFxTerminal({
        terminal: fx.xtermAdapter(terminal),
        wasm: "/fx/fx-term.wasm",
        env: {
          FX_MODEL: CHAT_MODEL,
          FX_THEME: "dark",
          FX_SKIP_ONBOARDING: "1",
          // The terminal requires a Gateway credential to start. This local
          // placeholder is never forwarded: all transport goes to /api/chat.
          AI_GATEWAY_API_KEY: "self-hosted-no-auth",
        },
        fetch: async (input, init) => {
          const url = new URL(input);
          if (url.hostname !== "ai-gateway.vercel.sh") {
            throw new Error("Unsupported terminal request.");
          }
          const method = init?.method ?? "GET";
          const isCompletion = url.pathname.endsWith("/ai/language-model");
          const isModels = url.pathname.endsWith("/models");
          if (
            !(isCompletion && method === "POST") &&
            !(isModels && method === "GET")
          ) {
            throw new Error("Unsupported terminal request.");
          }
          return fetch("/api/chat", {
            method,
            headers: { "Content-Type": "application/json" },
            body: init?.body,
            signal: init?.signal,
          });
        },
      });
      if (disposed) {
        runtime.abort();
        void runtime.interactive.catch(() => {});
        return;
      }
      await runtime.interactive;
      if (disposed) return;
      setStatus(null);
      terminal.focus();
      const exitCode = await runtime.exited;
      if (!disposed)
        setStatus(`Terminal closed (${exitCode}). Reload to start again.`);
    }

    void start().catch((error: unknown) => {
      runtime?.abort();
      if (!disposed) {
        setStatus(
          error instanceof Error
            ? error.message
            : "Unable to start the terminal.",
        );
      }
    });

    return () => {
      disposed = true;
      observer?.disconnect();
      runtime?.abort();
      terminal?.dispose();
    };
  }, []);

  return (
    <main className="relative h-dvh overflow-hidden bg-black p-4 text-white">
      <div ref={containerRef} className="h-full w-full" />
      {status && (
        <p
          role="status"
          className="absolute inset-x-4 top-4 bg-black font-mono text-sm"
        >
          {status}
        </p>
      )}
    </main>
  );
}
