import type Anthropic from "@anthropic-ai/sdk";

import type { ChatMessage } from "@/lib/validations";

/**
 * Text from a stream event, or undefined if the event carries no user-facing
 * text. Deliberately narrow: a stream also carries message/content-block
 * lifecycle events and (with thinking enabled) thinking deltas, none of which
 * belong in the reply shown to the user.
 */
export function textDeltaOf(
  event: Anthropic.MessageStreamEvent
): string | undefined {
  if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
    return event.delta.text;
  }
  return undefined;
}

/**
 * Advance the iterator until the first text delta, skipping lifecycle events.
 * Returns undefined if the stream ends without producing any text.
 *
 * The route calls this before returning a streaming Response: the SDK surfaces
 * request errors on first iteration rather than at call time, so pulling one
 * chunk up front is what lets a failure become a real status code instead of a
 * 200 with an error baked into the body.
 */
export async function firstTextChunk(
  iterator: AsyncIterator<Anthropic.MessageStreamEvent>
): Promise<string | undefined> {
  while (true) {
    const { done, value } = await iterator.next();
    if (done) return undefined;

    const text = textDeltaOf(value);
    if (text !== undefined) return text;
  }
}

/**
 * Append a streamed chunk to the trailing assistant message. Returns the array
 * unchanged when the last message isn't an assistant turn, so a stray chunk can
 * never mutate the user's own message.
 */
export function appendChunk(
  messages: ChatMessage[],
  chunk: string
): ChatMessage[] {
  const last = messages[messages.length - 1];
  if (last?.role !== "assistant") return messages;

  const updated = [...messages];
  updated[updated.length - 1] = { ...last, content: last.content + chunk };
  return updated;
}
