import { generateId, safeValidateUIMessages, type UIMessage } from "ai";

const STORAGE_KEY = "tty-chat";

type LegacyChatMessage = {
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
};

function isLegacyChatMessage(value: unknown): value is LegacyChatMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<LegacyChatMessage>;
  return (
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string" &&
    (message.reasoning === undefined || typeof message.reasoning === "string")
  );
}

export async function validateChatMessages(messages: unknown) {
  const result = await safeValidateUIMessages({ messages });
  if (
    !result.success ||
    !result.data.every(({ role, parts }) =>
      role === "user"
        ? parts.every((part) => part.type === "text")
        : role === "assistant" &&
          parts.every(
            (part) =>
              part.type === "text" ||
              part.type === "reasoning" ||
              part.type === "step-start",
          ),
    )
  ) {
    return undefined;
  }
  return result.data;
}

export function getMessageText(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

export async function loadChatMessages(): Promise<UIMessage[]> {
  try {
    const saved: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? "[]",
    );
    if (Array.isArray(saved) && saved.every(isLegacyChatMessage)) {
      return saved.map(({ role, content, reasoning }) => {
        const parts: UIMessage["parts"] = [];
        if (role === "assistant" && reasoning) {
          parts.push({ type: "reasoning", text: reasoning, state: "done" });
        }
        if (content || role === "user") {
          parts.push({ type: "text", text: content, state: "done" });
        }
        return { id: generateId(), role, parts };
      });
    }
    return (await validateChatMessages(saved)) ?? [];
  } catch {
    return [];
  }
}

export function saveChatMessages(messages: UIMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // The conversation still works if storage is disabled or full.
  }
}
