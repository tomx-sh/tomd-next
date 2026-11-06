import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
} from "ai";
import { getMessageText, validateChatMessages } from "@/lib/chat";

export const maxDuration = 300;

const CHAT_BASE_URL = "https://chat.tomd.sh/v1";
const CHAT_MODEL = "gemma4:e2b-it-qat";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const messages = await validateChatMessages(body?.messages);
  const latest = messages?.at(-1);
  if (!messages || latest?.role !== "user" || !getMessageText(latest).trim()) {
    return new Response("Invalid conversation.", { status: 400 });
  }
  const reasoning =
    typeof body?.reasoning === "boolean" ? body.reasoning : undefined;

  const apiKey = process.env.CHAT_API_KEY?.trim();
  if (!apiKey) {
    return new Response("Chat provider is not configured.", { status: 500 });
  }

  const provider = createOpenAICompatible({
    name: "ollama",
    baseURL: CHAT_BASE_URL,
    apiKey,
  });

  // Gemma only needs the visible transcript, including after a partial reply.
  const transcript = messages.flatMap((message) => {
    const text = getMessageText(message);
    return text.trim()
      ? [{ role: message.role, parts: [{ type: "text" as const, text }] }]
      : [];
  });
  const result = streamText({
    model: provider.chatModel(CHAT_MODEL),
    messages: await convertToModelMessages(transcript),
    providerOptions:
      reasoning === undefined
        ? undefined
        : { ollama: { reasoningEffort: reasoning ? "medium" : "none" } },
    abortSignal: request.signal,
    maxRetries: 0,
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      sendReasoning: reasoning !== false,
      onError: () => "Unable to get a reply from Gemma. Please try again.",
    }),
  });
}
