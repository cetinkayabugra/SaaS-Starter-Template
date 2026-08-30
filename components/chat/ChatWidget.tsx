"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MAX_CHAT_MESSAGE_LENGTH, type ChatMessage } from "@/lib/validations";
import { cn } from "@/lib/utils";

const GREETING = "Hi! Ask me anything about this SaaS starter template.";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, isStreaming]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();

    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];

    setMessages(nextMessages);
    setInput("");
    setError(null);
    setIsStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }

      setMessages((current) => [...current, { role: "assistant", content: "" }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        setMessages((current) => {
          const updated = [...current];
          const last = updated[updated.length - 1];
          if (last?.role === "assistant") {
            updated[updated.length - 1] = {
              ...last,
              content: last.content + chunk,
            };
          }
          return updated;
        });
      }
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setIsStreaming(false);
    }
  }

  if (!isOpen) {
    return (
      <Button
        size="icon-lg"
        aria-label="Open chat"
        onClick={() => setIsOpen(true)}
        className="fixed right-6 bottom-6 z-40 size-12 shadow-lg"
      >
        <MessageCircle className="size-5" />
      </Button>
    );
  }

  return (
    <div
      role="dialog"
      aria-label="Chat assistant"
      className="fixed right-6 bottom-6 z-40 flex h-[30rem] max-h-[calc(100svh-3rem)] w-[calc(100vw-3rem)] max-w-sm flex-col overflow-hidden rounded-xl border bg-card shadow-xl"
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <p className="text-sm font-medium">Ask about this template</p>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Close chat"
          onClick={() => setIsOpen(false)}
        >
          <X className="size-4" />
        </Button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        <p className="text-sm text-muted-foreground">{GREETING}</p>

        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              "flex",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              )}
            >
              {message.content ||
                (isStreaming && index === messages.length - 1 ? "…" : "")}
            </div>
          </div>
        ))}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <form onSubmit={sendMessage} className="flex items-center gap-2 border-t p-3">
        <input
          ref={inputRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          maxLength={MAX_CHAT_MESSAGE_LENGTH}
          disabled={isStreaming}
          aria-label="Message"
          placeholder="Ask a question…"
          className="h-8 min-w-0 flex-1 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
        />
        <Button
          type="submit"
          size="icon-sm"
          aria-label="Send message"
          disabled={isStreaming || !input.trim()}
        >
          <Send className="size-3.5" />
        </Button>
      </form>
    </div>
  );
}
