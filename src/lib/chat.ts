export const CHAT_MODEL = "gemma4:e2b-it-qat";
export const CHAT_BASE_URL = "https://chat.tomd.sh/v1";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
};

export type ChatDelta = { type: "reasoning" | "content"; text: string };

export function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<ChatMessage>;
  return (
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string" &&
    (message.reasoning === undefined || typeof message.reasoning === "string")
  );
}

export async function* readChatStream(
  response: Response,
): AsyncGenerator<ChatDelta> {
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  if (!response.body) throw new Error("Empty response.");
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  try {
    for (;;) {
      const { value, done } = await reader.read();
      buffer += value ?? "";
      const lines = buffer.split("\n");
      buffer = done ? "" : (lines.pop() ?? "");
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (data === "[DONE]") return;
        if (!data) continue;
        const delta = JSON.parse(data).choices?.[0]?.delta;
        const reasoning = delta?.reasoning_content ?? delta?.reasoning;
        if (typeof reasoning === "string" && reasoning)
          yield { type: "reasoning", text: reasoning };
        if (typeof delta?.content === "string" && delta.content)
          yield { type: "content", text: delta.content };
      }
      if (done) return;
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
