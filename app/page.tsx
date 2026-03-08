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
            "Error contacting AI service. Please try again or contact Nurse Erica directly.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="chat-page">
      <div className="chat-container">
        <h1 className="chat-title">Nurse Erica • Aesthetic Assistant</h1>
        <p className="chat-subtitle">
          Ask about Botox / Dysport / Xeomin, dermal fillers, or facial
          balancing in the King of Prussia, Phoenixville, and Morgantown, PA
          areas.
        </p>

        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty">
              Hi, I’m Nurse Erica’s aesthetic assistant. I can share general
              information about treatments and aftercare—no medical advice. May
              I have your first name and email so Nurse Erica can follow up with
              details and availability?
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

          {loading && <div className="chat-loading">Thinking…</div>}
        </div>

        <form onSubmit={handleSend} className="chat-input">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about treatments or aftercare..."
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
