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

      // This endpoint is public, so a caller can still POST a `context`
      // field (cached clients will). Only the two accepted fields are read;
      // everything else is discarded here. `context` is never bound to a
      // variable, so it cannot be forwarded, logged, or persisted -- which
      // matters more with Resend than it did with SMTP, because Resend
      // stores message bodies and exposes them in its dashboard.
      const name = body?.name?.toString() || "Unknown";
      const email = body?.email?.toString() || "Unknown";

  try {
          const result = await resend.emails.send({
                    from: "Nurse Erica Chatbot <onboarding@resend.dev>",
                    to: TO_EMAIL,
                    subject: `New Aesthetic Lead from ${name}`,
                    text: `Name: ${name}\nEmail: ${email}`,
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
