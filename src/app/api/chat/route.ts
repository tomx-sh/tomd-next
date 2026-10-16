import { CHAT_BASE_URL, CHAT_MODEL, isChatMessage } from "@/lib/chat";

export const maxDuration = 300;

export async function POST(request: Request) {
  let messages: unknown;
  try {
    messages = (await request.json())?.messages;
    if (
      !Array.isArray(messages) ||
      !messages.length ||
      !messages.every(isChatMessage)
    ) {
      return new Response("Invalid conversation.", { status: 400 });
    }
  } catch {
    return new Response("Invalid conversation.", { status: 400 });
  }

  const apiKey = process.env.CHAT_API_KEY?.trim();
  if (!apiKey) {
    return new Response("Chat provider is not configured.", { status: 500 });
  }

  try {
    const response = await fetch(`${CHAT_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: CHAT_MODEL, messages, stream: true }),
      signal: request.signal,
    });
    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") ?? "text/event-stream",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response("Unable to reach the model provider.", { status: 502 });
  }
}
