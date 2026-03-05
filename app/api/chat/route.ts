import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(req: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Server is missing OPENAI_API_KEY." },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => null);
  const messages = (body?.messages ?? []).map((m: any) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: String(m.content ?? "")
  }));

  const systemPrompt =
    "You are a concise, friendly assistant embedded on a Wix website. " +
    "Keep answers short, clear, and safe for all audiences.";

  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        temperature: 0.7
      })
    });

    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json(
        { error: `OpenAI error: ${text}` },
        { status: 500 }
      );
    }

    const data = await resp.json();
    const reply =
      data.choices?.[0]?.message?.content ??
      "I could not generate a response.";

    return NextResponse.json({ reply });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown error calling OpenAI." },
      { status: 500 }
    );
  }
}
