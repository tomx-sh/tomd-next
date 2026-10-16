import assert from "node:assert/strict";
import { test } from "node:test";
import { CHAT_BASE_URL, CHAT_MODEL } from "@/lib/chat";
import { POST } from "./route";

test("requires a server API key and authenticates the upstream stream", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.CHAT_API_KEY;
  const messages = [{ role: "user", content: "Hello" }];
  const request = () =>
    new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages }),
    });
  const stream = 'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n';
  let called = false;

  try {
    globalThis.fetch = (async (url, init) => {
      called = true;
      assert.equal(url, `${CHAT_BASE_URL}/chat/completions`);
      assert.equal(
        new Headers(init?.headers).get("Authorization"),
        "Bearer test-chat-key",
      );
      assert.deepEqual(JSON.parse(String(init?.body)), {
        model: CHAT_MODEL,
        messages,
        stream: true,
      });
      return new Response(stream, {
        headers: { "Content-Type": "text/event-stream" },
      });
    }) as typeof fetch;

    delete process.env.CHAT_API_KEY;
    assert.equal((await POST(request())).status, 500);
    assert.equal(called, false);

    process.env.CHAT_API_KEY = "test-chat-key";
    const response = await POST(request());
    assert.equal(called, true);
    assert.equal(response.status, 200);
    assert.equal(await response.text(), stream);
    assert.equal(response.headers.has("Authorization"), false);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.CHAT_API_KEY;
    else process.env.CHAT_API_KEY = originalKey;
  }
});
