import assert from "node:assert/strict";
import { test } from "node:test";
import { isChatMessage, readChatStream } from "./chat";

test("reads fragmented SSE and UTF-8, preserves reasoning, and stops at DONE", async () => {
  const bytes = new TextEncoder().encode(
    'data: {"choices":[{"delta":{"reasoning":"Réfléchir"}}]}\r\n\r\n' +
      'data: {"choices":[{"delta":{"content":"Héllo"}}]}\r\n\r\n' +
      'data: {"choices":[{"delta":{"content":"!"}}]}\n\n' +
      "data: [DONE]\n\n" +
      'data: {"choices":[{"delta":{"content":"ignored"}}]}\n\n',
  );
  const response = new Response(
    new ReadableStream({
      start(controller) {
        for (const byte of bytes) controller.enqueue(new Uint8Array([byte]));
        controller.close();
      },
    }),
  );
  const chunks = [];
  for await (const delta of readChatStream(response)) chunks.push(delta);
  assert.deepEqual(chunks, [
    { type: "reasoning", text: "Réfléchir" },
    { type: "content", text: "Héllo" },
    { type: "content", text: "!" },
  ]);
});

test("reads reasoning_content and answer text in the same event, ignoring metadata", async () => {
  const response = new Response(
    'data: {"choices":[{"delta":{"role":"assistant","content":""}}]}\n\n' +
      'data: {"choices":[{"delta":{"reasoning_content":"Let me think.","content":"Hello"}}]}\n\n' +
      'data: {"choices":[{"delta":{"reasoning_content":null,"content":"!"}}]}\n\n' +
      'data: {"choices":[{"delta":{},"finish_reason":"stop"}]}\n\n' +
      'data: {"choices":[],"usage":{"total_tokens":12}}\n\n',
  );
  const chunks = [];
  for await (const delta of readChatStream(response)) chunks.push(delta);
  assert.deepEqual(chunks, [
    { type: "reasoning", text: "Let me think." },
    { type: "content", text: "Hello" },
    { type: "content", text: "!" },
  ]);
});

test("accepts saved messages with or without reasoning, rejecting malformed reasoning", () => {
  assert.equal(isChatMessage({ role: "assistant", content: "Hello" }), true);
  assert.equal(
    isChatMessage({
      role: "assistant",
      content: "Hello",
      reasoning: "Thinking",
    }),
    true,
  );
  assert.equal(
    isChatMessage({ role: "assistant", content: "", reasoning: 123 }),
    false,
  );
});

test("preserves reasoning when a stream is cancelled before the answer", async () => {
  let cancelled = false;
  const response = new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            'data: {"choices":[{"delta":{"reasoning":"Still thinking"}}]}\n\n',
          ),
        );
      },
      cancel() {
        cancelled = true;
      },
    }),
  );
  for await (const delta of readChatStream(response)) {
    assert.deepEqual(delta, { type: "reasoning", text: "Still thinking" });
    break;
  }
  assert.equal(cancelled, true);
});

test("reads a final event without a trailing newline", async () => {
  const response = new Response(
    'data: {"choices":[{"delta":{"content":"hello"}}]}',
  );
  const chunks = [];
  for await (const text of readChatStream(response)) chunks.push(text);
  assert.deepEqual(chunks, [{ type: "content", text: "hello" }]);
});

test("reports HTTP errors and propagates cancellation", async () => {
  await assert.rejects(async () => {
    for await (const _ of readChatStream(
      new Response("error", { status: 502 }),
    )) {
    }
  }, /HTTP 502/);
  await assert.rejects(
    async () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.error(new DOMException("Cancelled", "AbortError"));
        },
      });
      for await (const _ of readChatStream(new Response(stream))) {
      }
    },
    { name: "AbortError" },
  );
});
