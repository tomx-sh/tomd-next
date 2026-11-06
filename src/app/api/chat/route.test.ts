import assert from "node:assert/strict";
import { test } from "node:test";
import { POST } from "./route";

test("requires a server key and streams the Gemma response in the AI SDK format", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.CHAT_API_KEY;
  const request = () =>
    new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [
          { id: "1", role: "user", parts: [{ type: "text", text: "Hello" }] },
        ],
      }),
    });
  let called = false;

  try {
    globalThis.fetch = (async (url, init) => {
      called = true;
      assert.equal(url, "https://chat.tomd.sh/v1/chat/completions");
      assert.equal(
        new Headers(init?.headers).get("Authorization"),
        "Bearer test-chat-key",
      );
      assert.deepEqual(JSON.parse(String(init?.body)), {
        model: "gemma4:e2b-it-qat",
        messages: [{ role: "user", content: "Hello" }],
        stream: true,
      });
      return new Response(
        'data: {"choices":[{"delta":{"reasoning":"Let me think."}}]}\n\n' +
          'data: {"choices":[{"delta":{"content":"Hello"},"finish_reason":"stop"}]}\n\n' +
          "data: [DONE]\n\n",
        { headers: { "Content-Type": "text/event-stream" } },
      );
    }) as typeof fetch;

    delete process.env.CHAT_API_KEY;
    assert.equal((await POST(request())).status, 500);
    assert.equal(called, false);

    process.env.CHAT_API_KEY = "test-chat-key";
    const response = await POST(request());
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("x-vercel-ai-ui-message-stream"), "v1");
    assert.equal(response.headers.has("Authorization"), false);
    const stream = await response.text();
    assert.match(stream, /"type":"reasoning-delta".*"delta":"Let me think\."/);
    assert.match(stream, /"type":"text-delta".*"delta":"Hello"/);
    assert.equal(called, true);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.CHAT_API_KEY;
    else process.env.CHAT_API_KEY = originalKey;
  }
});
