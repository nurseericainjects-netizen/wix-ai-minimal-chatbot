"use client";

import React, { useState, useRef, useEffect } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [leadSent, setLeadSent] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);
  const [showLeadForm, setShowLeadForm] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function buildContextSnippet(msgs: Message[]): string {
    return msgs
      .slice(-6)
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
        body: JSON.stringify({ name: name.trim(), email: email.trim(), context }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setLeadError(data?.error || "There was a problem sending your info. Please try again.");
        return;
      }

      setLeadSent(true);
      setShowLeadForm(false);
    } catch {
      setLeadError("There was a problem sending your info. Please try again or contact Nurse Erica directly.");
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
      const reply = data.reply ?? data.error ?? "Sorry, I could not generate a response.";
      setMessages([...history, { role: "assistant", content: reply }]);
    } catch {
      setMessages([
        ...history,
        { role: "assistant", content: "Error contacting AI service. Please try again or contact Nurse Erica directly." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="chat-page">
      <div className="chat-container">

        <div className="chat-header">
          <h1 className="chat-title">Nurse Erica • Aesthetic Assistant</h1>
          <p className="chat-subtitle">
            Botox · Dysport · Xeomin · Dermal Fillers · Facial Balancing
            <span className="chat-subtitle-location"> — King of Prussia, Phoenixville & Morgantown, PA</span>
          </p>
        </div>

        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty">
              Hi, I'm Nurse Erica's aesthetic assistant. Ask me anything about treatments and aftercare — no medical advice given.
            </div>
          )}

          {messages.map((m, idx) => (
            <div key={idx} className={"message-row " + (m.role === "user" ? "user" : "assistant")}>
              <span className={"message-bubble " + (m.role === "user" ? "message-user" : "message-bot")}>
                {m.content}
              </span>
            </div>
          ))}

          {loading && <div className="chat-loading">Thinking…</div>}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="chat-input">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about treatments or aftercare..."
            className="chat-input-field"
          />
          <button type="submit" disabled={loading} className="chat-send-button">
            Send
          </button>
        </form>

        <div className="lead-capture">
          {leadSent ? (
            <div className="lead-success">✓ Nurse Erica will review your questions and follow up.</div>
          ) : (
            <>
              <button
                type="button"
                className="lead-toggle"
                onClick={() => setShowLeadForm(!showLeadForm)}
              >
                {showLeadForm ? "Hide" : "Want Nurse Erica to follow up with you? →"}
              </button>

              {showLeadForm && (
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
                  <button type="button" onClick={sendLead} className="chat-send-button">
                    Send to Nurse Erica
                  </button>
                  {leadError && <div className="lead-error">{leadError}</div>}
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </main>
  );
}
