// biome-ignore-all lint/suspicious/noArrayIndexKey: Transcript rows only append or reset; existing rows never move.

"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { type ChatMessage, isChatMessage, readChatStream } from "@/lib/chat";

const STORAGE_KEY = "tty-chat";

function save(messages: ChatMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {}
}

export function Chat() {
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [reply, setReply] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      if (Array.isArray(saved) && saved.every(isChatMessage))
        setMessages(saved);
    } catch {}
    const cancel = (event: KeyboardEvent) => {
      if (
        event.ctrlKey &&
        event.key.toLowerCase() === "c" &&
        abortRef.current
      ) {
        event.preventDefault();
        abortRef.current.abort();
      }
    };
    document.addEventListener("keydown", cancel);
    return () => {
      document.removeEventListener("keydown", cancel);
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!busy) inputRef.current?.focus();
  }, [busy]);

  useEffect(() => {
    window.scrollTo(0, document.documentElement.scrollHeight);
  });

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text || abortRef.current) return;
    setInput("");
    setNotice("");
    if (text === "/clear") {
      setMessages([]);
      save([]);
      return;
    }

    const history: ChatMessage[] = [
      ...messages,
      { role: "user", content: text },
    ];
    const controller = new AbortController();
    abortRef.current = controller;
    setMessages(history);
    setBusy(true);
    let answer = "";
    let thinking = "";
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
        }),
        signal: controller.signal,
      });
      for await (const delta of readChatStream(response)) {
        if (delta.type === "reasoning") {
          thinking += delta.text;
          setReasoning(thinking);
        } else {
          answer += delta.text;
          setReply(answer);
        }
      }
      if (!answer) throw new Error("Empty reply.");
    } catch (error) {
      setNotice(
        controller.signal.aborted
          ? "^C"
          : `[error] ${error instanceof Error ? error.message : "Unable to send message."}`,
      );
    } finally {
      const next: ChatMessage[] =
        answer || thinking
          ? [
              ...history,
              {
                role: "assistant",
                content: answer,
                ...(thinking ? { reasoning: thinking } : {}),
              },
            ]
          : messages;
      setMessages(next);
      save(next);
      setReply("");
      setReasoning("");
      setBusy(false);
      abortRef.current = null;
    }
  }

  return (
    <main className="w-full">
      <div
        className="min-h-dvh whitespace-pre-wrap p-4 font-mono text-sm leading-relaxed text-muted-foreground"
        onPointerUp={() => {
          if (!window.getSelection()?.toString()) inputRef.current?.focus();
        }}
      >
        <div role="log" aria-label="Conversation" aria-busy={busy}>
          <div className="mb-4 font-bold text-foreground">
            Hi! I am a small Gemma 4 model running on a home lab Raspberry Pi.
          </div>
          {messages.map((message, index) => (
            <div
              key={`${index}-${message.role}`}
              className={message.role === "user" ? "text-foreground" : "mb-4"}
            >
              {message.role === "user" ? (
                `>>> ${message.content}`
              ) : (
                <>
                  {message.reasoning && (
                    <div className="mb-2 text-muted-foreground/70">
                      {message.reasoning}
                    </div>
                  )}
                  <div className="font-bold text-foreground">
                    {message.content}
                  </div>
                </>
              )}
            </div>
          ))}
          {busy && (
            <div className="mb-4">
              {!reply && !reasoning && (
                <div className="text-muted-foreground/70">
                  <span aria-hidden="true" className="chat-spinner" />{" "}
                  <span className="shimmer">Thinking...</span>
                </div>
              )}
              {reasoning && (
                <div className="mb-2 text-muted-foreground/70">{reasoning}</div>
              )}
              {reply && (
                <div className="font-bold text-foreground">{reply}</div>
              )}
            </div>
          )}
          {notice && <div className="mb-4">{notice}</div>}
        </div>
        {!busy && (
          <form onSubmit={send} className="flex text-foreground">
            <span aria-hidden="true">{">>> "}</span>
            <input
              ref={inputRef}
              aria-label="Message"
              autoComplete="off"
              placeholder="Send a message (/clear to reset)"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              className="min-w-0 flex-1 border-0 bg-transparent p-0 text-foreground outline-none placeholder:text-muted-foreground"
            />
          </form>
        )}
      </div>
    </main>
  );
}
