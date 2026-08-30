import { describe, expect, it } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";

import { appendChunk, firstTextChunk, textDeltaOf } from "@/lib/chat-stream";
import type { ChatMessage } from "@/lib/validations";

type Event = Anthropic.MessageStreamEvent;

const textDelta = (text: string) =>
  ({
    type: "content_block_delta",
    index: 0,
    delta: { type: "text_delta", text },
  }) as Event;

const thinkingDelta = (thinking: string) =>
  ({
    type: "content_block_delta",
    index: 0,
    delta: { type: "thinking_delta", thinking },
  }) as unknown as Event;

const inputJsonDelta = (partial: string) =>
  ({
    type: "content_block_delta",
    index: 0,
    delta: { type: "input_json_delta", partial_json: partial },
  }) as unknown as Event;

const messageStart = { type: "message_start" } as unknown as Event;
const contentBlockStart = { type: "content_block_start", index: 0 } as unknown as Event;
const contentBlockStop = { type: "content_block_stop", index: 0 } as unknown as Event;
const messageStop = { type: "message_stop" } as unknown as Event;

async function* streamOf(...events: Event[]) {
  for (const event of events) yield event;
}

describe("textDeltaOf", () => {
  it("extracts text from a text delta", () => {
    expect(textDeltaOf(textDelta("hello"))).toBe("hello");
  });

  it("preserves an empty text delta as empty string, not undefined", () => {
    // Distinct from "no text here" — the caller uses undefined as the sentinel.
    expect(textDeltaOf(textDelta(""))).toBe("");
  });

  it("ignores thinking deltas so reasoning never leaks into the reply", () => {
    expect(textDeltaOf(thinkingDelta("internal reasoning"))).toBeUndefined();
  });

  it("ignores tool input deltas", () => {
    expect(textDeltaOf(inputJsonDelta('{"a":1}'))).toBeUndefined();
  });

  it.each([
    ["message_start", messageStart],
    ["content_block_start", contentBlockStart],
    ["content_block_stop", contentBlockStop],
    ["message_stop", messageStop],
  ])("ignores the %s lifecycle event", (_label, event) => {
    expect(textDeltaOf(event)).toBeUndefined();
  });
});

describe("firstTextChunk", () => {
  it("returns the first text delta", async () => {
    const stream = streamOf(textDelta("first"), textDelta("second"));
    expect(await firstTextChunk(stream[Symbol.asyncIterator]())).toBe("first");
  });

  it("skips leading lifecycle and thinking events", async () => {
    const stream = streamOf(
      messageStart,
      thinkingDelta("reasoning"),
      contentBlockStart,
      textDelta("actual reply")
    );
    expect(await firstTextChunk(stream[Symbol.asyncIterator]())).toBe("actual reply");
  });

  it("returns undefined when the stream yields no text at all", async () => {
    const stream = streamOf(messageStart, thinkingDelta("only thinking"), messageStop);
    expect(await firstTextChunk(stream[Symbol.asyncIterator]())).toBeUndefined();
  });

  it("returns undefined for an empty stream", async () => {
    const stream = streamOf();
    expect(await firstTextChunk(stream[Symbol.asyncIterator]())).toBeUndefined();
  });

  it("leaves the rest of the stream available to the caller", async () => {
    // The route hands the same iterator to the ReadableStream afterwards, so
    // consuming the first chunk must not drop what follows.
    const stream = streamOf(messageStart, textDelta("a"), textDelta("b"), textDelta("c"));
    const iterator = stream[Symbol.asyncIterator]();

    expect(await firstTextChunk(iterator)).toBe("a");

    const rest: string[] = [];
    while (true) {
      const { done, value } = await iterator.next();
      if (done) break;
      const text = textDeltaOf(value);
      if (text !== undefined) rest.push(text);
    }
    expect(rest).toEqual(["b", "c"]);
  });

  it("propagates an error thrown during iteration", async () => {
    // This is the path that turns an API failure into a real status code.
    async function* failing(): AsyncGenerator<Event> {
      yield messageStart;
      throw new Error("401 authentication_error");
    }
    await expect(firstTextChunk(failing()[Symbol.asyncIterator]())).rejects.toThrow(
      "401 authentication_error"
    );
  });
});

describe("appendChunk", () => {
  const base: ChatMessage[] = [
    { role: "user", content: "question" },
    { role: "assistant", content: "par" },
  ];

  it("appends to the trailing assistant message", () => {
    expect(appendChunk(base, "tial")).toEqual([
      { role: "user", content: "question" },
      { role: "assistant", content: "partial" },
    ]);
  });

  it("accumulates across successive chunks", () => {
    const chunks = ["He", "llo", " there"];
    const result = chunks.reduce(appendChunk, [
      { role: "assistant", content: "" },
    ] as ChatMessage[]);

    expect(result).toEqual([{ role: "assistant", content: "Hello there" }]);
  });

  it("leaves a trailing user message untouched", () => {
    // Guards the window between sending and the assistant placeholder existing.
    const userLast: ChatMessage[] = [{ role: "user", content: "question" }];
    expect(appendChunk(userLast, "stray")).toEqual(userLast);
  });

  it("returns an empty list unchanged", () => {
    expect(appendChunk([], "stray")).toEqual([]);
  });

  it("does not mutate the input array or its messages", () => {
    const messages: ChatMessage[] = [{ role: "assistant", content: "a" }];
    const snapshot = structuredClone(messages);

    const result = appendChunk(messages, "b");

    expect(messages).toEqual(snapshot);
    expect(result).not.toBe(messages);
    expect(result[0]).not.toBe(messages[0]);
  });

  it("preserves earlier messages by reference", () => {
    const result = appendChunk(base, "tial");
    expect(result[0]).toBe(base[0]);
  });
});
