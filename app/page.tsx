"use client";

import React, { useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const newMessage: Message = { role: "user", content: input.trim() };
    const history = [...messages, newMessage];
    setMessages(history);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      const data = await res.json();
      const reply =
        data.reply ??
        data.error ??
        "Sorry, I could not generate a response.";

      setMessages([...history, { role: "assistant", content: reply }]);
    } catch (err: any) {
      setMessages([
        ...history,
        {
          role: "assistant",
          content:
            "Error contacting AI service: " + (err?.message ?? "Unknown error"),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="chat-page">
      <div className="chat-container">
        <h1 className="chat-title">Aesthetic Services Assistant</h1>
        <p className="chat-subtitle">
          Type a question below.
        </p>

        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty">
              Start your personalized journey here.
            </div>
          )}

          {messages.map((m, idx) => (
            <div
              key={idx}
              className={
                "message-row " + (m.role === "user" ? "user" : "assistant")
              }
            >
              <span
                className={
                  "message-bubble " +
                  (m.role === "user" ? "message-user" : "message-bot")
                }
              >
                {m.content}
              </span>
            </div>
          ))}

          {loading && (
            <div className="chat-loading">Thinking…</div>
          )}
        </div>

        <form onSubmit={handleSend} className="chat-input">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="chat-input-field"
          />
          <button
            type="submit"
            disabled={loading}
            className="chat-send-button"
          >
            Send
          </button>
        </form>
      </div>
    </main>
  );
}
