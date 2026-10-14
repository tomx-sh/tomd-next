import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { CHAT_MODEL } from "@/lib/chat";
import { GET, POST } from "./route";

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("adapts fx prompts and streamed replies without provider credentials", async () => {
  let upstreamUrl: string | undefined;
  let upstreamOptions: RequestInit | undefined;
  globalThis.fetch = (async (input, init) => {
    upstreamUrl = String(input);
    upstreamOptions = init;
    const chunks = [
      {
        choices: [
          { index: 0, delta: { content: "Hello" }, finish_reason: null },
        ],
      },
      { choices: [{ index: 0, delta: { content: "!" }, finish_reason: null }] },
      { choices: [{ index: 0, delta: {}, finish_reason: "stop" }] },
      {
        choices: [],
        usage: { prompt_tokens: 10, completion_tokens: 2, total_tokens: 12 },
      },
    ];
    return new Response(
      `${chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join("")}data: [DONE]\n\n`,
      { headers: { "Content-Type": "text/event-stream" } },
    );
  }) as typeof fetch;

  const response = await POST(
    new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        prompt: [
          { role: "user", content: [{ type: "text", text: "First question" }] },
          {
            role: "assistant",
            content: [{ type: "text", text: "First reply" }],
          },
          { role: "user", content: [{ type: "text", text: "Follow-up" }] },
        ],
      }),
    }),
  );

  assert.equal(upstreamUrl, "https://chat.tomd.sh/v1/chat/completions");
  assert.equal(
    new Headers(upstreamOptions?.headers).has("authorization"),
    false,
  );
  const payload = JSON.parse(String(upstreamOptions?.body));
  assert.equal(payload.model, CHAT_MODEL);
  assert.deepEqual(
    payload.messages.map((message: { content: string }) => message.content),
    ["First question", "First reply", "Follow-up"],
  );
  assert.equal(payload.stream, true);
  const events = (await response.text())
    .trim()
    .split("\n\n")
    .map((line) => JSON.parse(line.slice("data: ".length)));
  assert.equal(
    events
      .filter((event) => event.type === "text-delta")
      .map((event) => event.delta)
      .join(""),
    "Hello!",
  );
  assert.equal(
    events.find((event) => event.type === "finish").finishReason.unified,
    "stop",
  );
});

test("rejects invalid conversations before contacting the provider", async () => {
  globalThis.fetch = (() => {
    throw new Error("Unexpected network request");
  }) as typeof fetch;
  for (const body of ["invalid JSON", "{}", '{"prompt":[]}']) {
    assert.equal(
      (
        await POST(
          new Request("http://localhost/api/chat", { method: "POST", body }),
        )
      ).status,
      400,
    );
  }
});

test("offers only the requested Gemma model in the terminal model menu", async () => {
  globalThis.fetch = (async () =>
    Response.json({
      data: [{ id: "qwen3:4b" }, { id: CHAT_MODEL }],
    })) as typeof fetch;
  const response = await GET(new Request("http://localhost/api/chat"));
  assert.deepEqual((await response.json()).data, [{ id: CHAT_MODEL }]);
});
