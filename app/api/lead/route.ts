import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const TO_EMAIL = process.env.BUSINESS_EMAIL;

export async function POST(req: NextRequest) {
      if (!process.env.RESEND_API_KEY || !TO_EMAIL) {
              return NextResponse.json(
                  { error: "Email server is not configured.", key: !!process.env.RESEND_API_KEY, to: !!TO_EMAIL },
                  { status: 500 }
                      );
      }

  const body = await req.json().catch(() => null);
      const name = body?.name?.toString() || "Unknown";
      const email = body?.email?.toString() || "Unknown";
      const context = body?.context?.toString() || "";

  try {
          const result = await resend.emails.send({
                    from: "Nurse Erica Chatbot <onboarding@resend.dev>",
                    to: TO_EMAIL,
                    subject: `New Aesthetic Lead from ${name}`,
                    text: `Name: ${name}\nEmail: ${email}\n\nConversation snippet:\n${context}`,
          });

        return NextResponse.json({ ok: true, result });
  } catch (err: any) {
          console.error("Email send error:", err);
          return NextResponse.json(
              { error: err?.message || "Failed to send email.", details: JSON.stringify(err) },
              { status: 500 }
                  );
  }
}
