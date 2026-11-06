import assert from "node:assert/strict";
import { test } from "node:test";
import { getMessageText, loadChatMessages, saveChatMessages } from "./chat";

test("restores legacy chats, preserves SDK message IDs, and clears history", async () => {
  const originalStorage = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage",
  );
  const storage = new Map([
    [
      "tty-chat",
      JSON.stringify([
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi!", reasoning: "Thinking" },
      ]),
    ],
  ]);

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => storage.get(key),
      setItem: (key: string, value: string) => storage.set(key, value),
    },
  });

  try {
    const messages = await loadChatMessages();
    assert.equal(messages.length, 2);
    assert.notEqual(messages[0].id, messages[1].id);
    assert.equal(getMessageText(messages[0]), "Hello");
    assert.equal(getMessageText(messages[1]), "Hi!");
    assert.deepEqual(messages[1].parts[0], {
      type: "reasoning",
      text: "Thinking",
      state: "done",
    });

    saveChatMessages(messages);
    assert.deepEqual(await loadChatMessages(), messages);

    saveChatMessages([]);
    assert.deepEqual(await loadChatMessages(), []);

    storage.set("tty-chat", '{"messages":false}');
    assert.deepEqual(await loadChatMessages(), []);
  } finally {
    if (originalStorage) {
      Object.defineProperty(globalThis, "localStorage", originalStorage);
    } else {
      Reflect.deleteProperty(globalThis, "localStorage");
    }
  }
});
