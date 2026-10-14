import assert from "node:assert/strict";
import { test } from "node:test";
import { readChatStream } from "./chat";

test("reads fragmented SSE and UTF-8, ignores reasoning, and stops at DONE", async () => {
  const bytes = new TextEncoder().encode(
    'data: {"choices":[{"delta":{"reasoning":"hidden"}}]}\r\n\r\n' +
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
  let reply = "";
  for await (const text of readChatStream(response)) reply += text;
  assert.equal(reply, "Héllo!");
});

test("reads a final event without a trailing newline", async () => {
  const response = new Response(
    'data: {"choices":[{"delta":{"content":"hello"}}]}',
  );
  const chunks = [];
  for await (const text of readChatStream(response)) chunks.push(text);
  assert.deepEqual(chunks, ["hello"]);
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
