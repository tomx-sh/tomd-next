import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { CHAT_BASE_URL, CHAT_MODEL } from "@/lib/chat";

export const maxDuration = 300;

const provider = createOpenAICompatible({
  name: "tomd",
  baseURL: CHAT_BASE_URL,
  includeUsage: true,
});
const model = provider.chatModel(CHAT_MODEL);
type StreamOptions = Parameters<typeof model.doStream>[0];

export async function GET(request: Request) {
  try {
    const response = await fetch(`${CHAT_BASE_URL}/models`, {
      cache: "no-store",
      signal: request.signal,
    });
    if (!response.ok) {
      return new Response("Unable to load models.", {
        status: response.status,
      });
    }
    const catalog = await response.json();
    return Response.json({
      ...catalog,
      data: catalog.data.filter(
        (entry: { id: string }) => entry.id === CHAT_MODEL,
      ),
    });
  } catch {
    return new Response("Unable to reach the model provider.", { status: 502 });
  }
}

export async function POST(request: Request) {
  let body: Pick<StreamOptions, "prompt">;
  try {
    body = await request.json();
    if (!body || !Array.isArray(body.prompt) || body.prompt.length === 0) {
      return new Response("A conversation is required.", { status: 400 });
    }
  } catch {
    return new Response("Invalid conversation.", { status: 400 });
  }

  try {
    // fx's WASM terminal uses the AI SDK Gateway wire format. The compatible
    // provider translates its prompt to OpenAI Chat Completions without auth.
    const { stream } = await model.doStream({
      prompt: body.prompt,
      abortSignal: request.signal,
    });
    const encoder = new TextEncoder();
    const events = stream.pipeThrough(
      new TransformStream({
        transform(event, controller) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
          );
        },
      }),
    );
    return new Response(events, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response("Unable to reach the model provider.", { status: 502 });
  }
}
