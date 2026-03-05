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
        body: JSON.stringify({ messages: history })
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
            "Error contacting AI service: " + (err?.message ?? "Unknown error")
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        padding: "16px",
        backgroundColor: "#020617",
        color: "white"
      }}
    >
      <div style={{ width: "100%", maxWidth: 640 }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Aesthetic Services Assistant</h1>
        <p style={{ marginBottom: 16, color: "#cbd5f5" }}>
          Type a question below. 
        </p>

        <div
          style={{
            border: "1px solid #1e293b",
            borderRadius: 8,
            padding: 12,
            backgroundColor: "#020617",
            maxHeight: "60vh",
            overflowY: "auto",
            marginBottom: 12
          }}
        >
          {messages.length === 0 && (
            <div style={{ color: "#64748b" }}>
              Start your personalized journey here.
            </div>
          )}
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: 6,
                textAlign: m.role === "user" ? "right" : "left"
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  padding: "6px 10px",
                  borderRadius: 12,
                  backgroundColor: m.role === "user" ? "#1d4ed8" : "#111827",
                  maxWidth: "80%",
                  whiteSpace: "pre-wrap"
                }}
              >
                {m.content}
              </span>
            </div>
          ))}
          {loading && (
            <div style={{ color: "#64748b" }}>Thinking…</div>
          )}
        </div>

        <form
          onSubmit={handleSend}
          style={{ display: "flex", gap: 8 }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            style={{
              flex: 1,
              padding: "8px 10px",
              borderRadius: 999,
              border: "1px solid #1e293b",
              backgroundColor: "#020617",
              color: "white"
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              border: "none",
              backgroundColor: loading ? "#4b5563" : "#22c55e",
              color: "#020617",
              fontWeight: 600,
              cursor: loading ? "default" : "pointer"
            }}
          >
            Send
          </button>
        </form>
      </div>
    </main>
  );
}
