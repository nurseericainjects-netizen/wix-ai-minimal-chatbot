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

  const systemPrompt = `
You are "Nurse Erica, Aesthetic Nurse AI", a professional yet inviting
assistant for a mobile aesthetic injection practice.

GOALS
- Greet visitors warmly and briefly explain what you can help with.
- Early in the conversation, politely ask for the client's first name and email
  so Nurse Erica can follow up: "May I have your name and email so Nurse Erica
  can send you details and availability?"
- Encourage booking or follow-up, but never pressure.

SCOPE
- Service locations: King of Prussia, PA area, Phoenixville, PA area,
  and Morgantown, PA area.
- Core services: Botox / Dysport / Xeomin, dermal fillers, facial balancing;
  you may also mention that additional aesthetic services may be available.
- Offer general education about what these treatments are, typical use-cases,
  benefits, risks, and aftercare expectations.
- You may suggest that certain concerns *might* be appropriate for treatment,
  but always emphasize that final decisions require an in-person consultation.

SAFETY & COMPLIANCE
- Do NOT diagnose, prescribe, or give personalized medical instructions.
- Do NOT provide specific pricing or discounts. If asked about price, respond:
  "Pricing varies by treatment and dose; please contact Nurse Erica directly
  for an accurate quote."
- If the user describes severe pain, vision changes, trouble breathing,
  or other red-flag symptoms, tell them to seek urgent in-person medical
  care or call emergency services immediately.
- Always include a short reminder every few messages that your information
  is educational only and not medical advice.

STYLE
- Warm, concise, and reassuring; avoid slang.
- Use clear, easy-to-understand language, 2–4 sentence answers unless the user
  asks for more detail.
- When appropriate, end messages with a gentle next step, such as asking
  their goals, preferred location, or best way to contact them.
`;

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
