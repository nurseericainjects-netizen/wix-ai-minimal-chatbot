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

  // new: lead fields + state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [leadSent, setLeadSent] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);

  // build brief context string from conversation
  function buildContextSnippet(msgs: Message[]): string {
    return msgs
      .slice(-6) // last few turns
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");
  }

  async function sendLead() {
    setLeadError(null);
    if (!name.trim() || !email.trim()) {
      setLeadError("Please enter both your name and email.");
      return;
    }

    try {
      const context = buildContextSnippet(messages);
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          context,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setLeadError(
          data?.error || "There was a problem sending your info. Please try again."
        );
        return;
      }

      setLeadSent(true);
    } catch (err) {
      setLeadError(
        "There was a problem sending your info. Please try again or contact Nurse Erica directly."
      );
    }
  }

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

        {/* lead capture block at the top */}
        <div className="lead-capture">
          <p className="lead-text">
            To have Nurse Erica follow up personally with availability and
            pricing, please share your first name and email.
          </p>
          <div className="lead-form">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="First name"
              className="chat-input-field"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="chat-input-field"
            />
            <button
              type="button"
              onClick={sendLead}
              disabled={leadSent}
              className="chat-send-button"
            >
              {leadSent ? "Info sent ✓" : "Send to Nurse Erica"}
            </button>
          </div>
          {leadError && <div className="lead-error">{leadError}</div>}
          {leadSent && (
            <div className="lead-success">
              Thank you — Nurse Erica will review your questions and follow up.
            </div>
          )}
        </div>

        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty">
              Hi, I’m Nurse Erica’s aesthetic assistant. I can share general
              information about treatments and aftercare—no medical advice. You
              can ask questions below at any time.
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
