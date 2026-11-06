"use client";

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import {
  ArrowLeftIcon,
  ArrowUpIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  CpuIcon,
  LightbulbIcon,
  LightbulbOffIcon,
  PlusIcon,
  SquareIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Streamdown } from "streamdown";
import { MarkdownPre } from "@/components/markdown-code-block";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import {
  Message,
  MessageContent,
  MessageHeader,
} from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { Spinner } from "@/components/ui/spinner";
import { Toggle } from "@/components/ui/toggle";
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from "@/components/ui/trace";
import { getMessageText, loadChatMessages, saveChatMessages } from "@/lib/chat";

const suggestions = [
  "Explain how a Raspberry Pi runs a language model",
  "Show me a useful shell command",
  "Give me a weekend coding project",
];

function ChatWelcome({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CpuIcon />
        </EmptyMedia>
        <h2 className="text-3xl font-semibold tracking-tight">
          Chat with Gemma
        </h2>
        <EmptyDescription>
          A small language model running on a Raspberry Pi in my home lab.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {suggestions.map((suggestion) => (
          <Button
            key={suggestion}
            type="button"
            variant="outline"
            size="lg"
            disabled={disabled}
            onClick={() => onSend(suggestion)}
          >
            {suggestion}
          </Button>
        ))}
      </EmptyContent>
    </Empty>
  );
}

function ChatReasoning({ text, running }: { text: string; running: boolean }) {
  const [open, setOpen] = useState<boolean>();

  return (
    <Trace>
      <TraceCollapsible open={open ?? running} onOpenChange={setOpen}>
        <TraceCollapsibleTrigger>
          <TraceLine status={running ? "running" : undefined}>
            <TraceIcon>
              {running ? (
                <Spinner
                  aria-hidden="true"
                  className="motion-reduce:animate-none"
                />
              ) : (
                <CircleCheckIcon />
              )}
            </TraceIcon>
            <TraceTitle>{running ? "Thinking…" : "Reasoning"}</TraceTitle>
          </TraceLine>
        </TraceCollapsibleTrigger>
        <TraceCollapsibleContent className="whitespace-pre-wrap">
          {text}
        </TraceCollapsibleContent>
      </TraceCollapsible>
    </Trace>
  );
}

function ChatTurn({
  message,
  streaming,
}: {
  message: UIMessage;
  streaming: boolean;
}) {
  const text = getMessageText(message);
  if (message.role === "user") {
    return (
      <Message align="end">
        <MessageContent>
          <MessageHeader>You</MessageHeader>
          <Bubble align="end" variant="muted">
            <BubbleContent className="whitespace-pre-wrap">
              {text}
            </BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    );
  }

  const reasoning = message.parts.filter((part) => part.type === "reasoning");
  const thoughts = reasoning.map((part) => part.text).join("\n\n");
  if (!text && !thoughts) return null;

  return (
    <Message>
      <MessageContent>
        <span className="font-medium text-muted-foreground">Gemma</span>
        {thoughts && (
          <ChatReasoning
            text={thoughts}
            running={
              streaming && reasoning.some((part) => part.state === "streaming")
            }
          />
        )}
        {text && (
          <Streamdown
            className="typeset min-w-0 text-base"
            isAnimating={streaming}
            parseIncompleteMarkdown={streaming}
            components={{
              pre: ({ children }) => <MarkdownPre>{children}</MarkdownPre>,
            }}
            disallowedElements={["img"]}
            skipHtml
          >
            {text}
          </Streamdown>
        )}
      </MessageContent>
    </Message>
  );
}

export function Chat() {
  const {
    messages,
    setMessages,
    status,
    error,
    clearError,
    sendMessage,
    stop,
    regenerate,
  } = useChat({ onFinish: ({ messages }) => saveChatMessages(messages) });
  const [input, setInput] = useState("");
  const [reasoning, setReasoning] = useState(true);
  const [restored, setRestored] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const busy = status === "submitted" || status === "streaming";
  const lastMessage = messages.at(-1);
  const waiting =
    busy &&
    (lastMessage?.role !== "assistant" ||
      !lastMessage.parts.some(
        (part) =>
          (part.type === "text" || part.type === "reasoning") && part.text,
      ));

  useEffect(() => {
    let active = true;
    void loadChatMessages().then((saved) => {
      if (!active) return;
      setMessages(saved);
      setRestored(true);
    });
    return () => {
      active = false;
    };
  }, [setMessages]);

  useEffect(() => {
    if (!busy) return;

    function handleCancel(event: KeyboardEvent) {
      if (
        event.ctrlKey &&
        event.key.toLowerCase() === "c" &&
        !window.getSelection()?.toString()
      ) {
        event.preventDefault();
        void stop();
      }
    }

    document.addEventListener("keydown", handleCancel);
    return () => document.removeEventListener("keydown", handleCancel);
  }, [busy, stop]);

  function reset() {
    setMessages([]);
    saveChatMessages([]);
    clearError();
    setInput("");
    inputRef.current?.focus();
  }

  function send(value: string) {
    const text = value.trim();
    if (!restored || busy || !text) return;
    if (text === "/clear") {
      reset();
      return;
    }
    setInput("");
    void sendMessage({ text }, { body: { reasoning } });
  }

  return (
    <main className="flex h-dvh min-h-0 flex-col">
      <header className="shrink-0 border-b">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              render={<Link href="/" />}
              nativeButton={false}
              variant="ghost"
              size="icon"
              aria-label="Home"
            >
              <ArrowLeftIcon />
            </Button>
            <h1 className="font-semibold">Chat</h1>
            <Badge variant="secondary">Gemma 4</Badge>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={!restored || busy || messages.length === 0}
            onClick={reset}
          >
            <PlusIcon data-icon="inline-start" />
            New chat
          </Button>
        </div>
      </header>

      {messages.length === 0 ? (
        <div className="flex min-h-0 flex-1 overflow-y-auto">
          <ChatWelcome onSend={send} disabled={!restored} />
        </div>
      ) : (
        <div className="min-h-0 flex-1">
          <MessageScrollerProvider
            autoScroll
            defaultScrollPosition="last-anchor"
          >
            <MessageScroller>
              <MessageScrollerViewport>
                <MessageScrollerContent
                  aria-label="Conversation"
                  className="mx-auto max-w-3xl px-4 py-6 sm:px-6"
                >
                  {messages.map((message) => (
                    <MessageScrollerItem
                      key={message.id}
                      messageId={message.id}
                      scrollAnchor={message.role === "user"}
                    >
                      <ChatTurn
                        message={message}
                        streaming={busy && message.id === lastMessage?.id}
                      />
                    </MessageScrollerItem>
                  ))}
                  {waiting && (
                    <MessageScrollerItem>
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Spinner
                          aria-hidden="true"
                          className="motion-reduce:animate-none"
                        />
                        Waiting for Gemma…
                      </span>
                    </MessageScrollerItem>
                  )}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
          </MessageScrollerProvider>
        </div>
      )}

      <div className="mx-auto w-full max-w-3xl shrink-0 space-y-2 px-4 pt-2 pb-4 sm:px-6">
        {error && (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertTitle>Gemma couldn’t reply</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
            <AlertAction>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void regenerate({ body: { reasoning } })}
              >
                Try again
              </Button>
            </AlertAction>
          </Alert>
        )}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            send(input);
          }}
        >
          <InputGroup>
            <InputGroupTextarea
              ref={inputRef}
              aria-label="Message"
              placeholder="Message Gemma"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              rows={2}
              className="max-h-36 text-base"
            />
            <InputGroupAddon align="block-end">
              <Toggle
                type="button"
                variant="outline"
                pressed={reasoning}
                onPressedChange={setReasoning}
                className={
                  reasoning ? undefined : "bg-background hover:bg-background"
                }
                title="Applies to the next reply"
              >
                {reasoning ? (
                  <LightbulbIcon aria-hidden="true" data-icon="inline-start" />
                ) : (
                  <LightbulbOffIcon
                    aria-hidden="true"
                    data-icon="inline-start"
                  />
                )}
                Reasoning
              </Toggle>
              <span className="me-auto hidden sm:inline">
                Shift + Enter for a new line
              </span>
              {busy ? (
                <InputGroupButton
                  size="icon-sm"
                  variant="outline"
                  className="ms-auto"
                  aria-label="Stop response"
                  onClick={() => void stop()}
                >
                  <SquareIcon />
                </InputGroupButton>
              ) : (
                <InputGroupButton
                  type="submit"
                  size="icon-sm"
                  variant="default"
                  className="ms-auto"
                  aria-label="Send message"
                  disabled={!restored || !input.trim()}
                >
                  <ArrowUpIcon />
                </InputGroupButton>
              )}
            </InputGroupAddon>
          </InputGroup>
        </form>
        <p className="text-center text-xs text-muted-foreground">
          History is saved in this browser.
        </p>
      </div>
    </main>
  );
}
