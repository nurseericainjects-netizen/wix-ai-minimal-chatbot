import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const TO_EMAIL = process.env.BUSINESS_EMAIL;

const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;

function isControlChar(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return code < 32 || code === 127;
}

/**
 * Make a caller-supplied value safe to interpolate into a mail header.
 *
 * Truncates at the first control character rather than stripping them: a name
 * of "Jane<CRLF>Bcc: attacker@example.com" must become "Jane", not
 * "JaneBcc: attacker@example.com" -- removing the line break alone would keep
 * the injected header text in the subject.
 */
function sanitizeHeader(value: string): string {
  let out = "";
  for (const ch of value) {
    if (isControlChar(ch)) break;
    out += ch;
  }
  return out.trim().slice(0, MAX_NAME_LENGTH);
}

/** Deliberately permissive: reject the obviously broken, do not police RFC 5322. */
function isValidEmail(value: string): boolean {
  if (!value || value.length > MAX_EMAIL_LENGTH) return false;
  for (const ch of value) {
    if (isControlChar(ch) || ch === " ") return false;
  }
  const at = value.indexOf("@");
  if (at < 1 || at !== value.lastIndexOf("@")) return false;
  const domain = value.slice(at + 1);
  const dot = domain.indexOf(".");
  return dot > 0 && dot < domain.length - 1;
}

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY || !TO_EMAIL) {
    // Deliberately opaque: this endpoint is public, and which specific piece
    // of configuration is missing is not the caller's business.
    console.error("Lead endpoint misconfigured", {
      hasKey: !!process.env.RESEND_API_KEY,
      hasRecipient: !!TO_EMAIL,
    });
    return NextResponse.json(
      { error: "Email server is not configured." },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => null);

  // This endpoint is public, so a caller can still POST a `context` field
  // (cached clients will). Only the two accepted fields are read; everything
  // else is discarded here. `context` is never bound to a variable, so it
  // cannot be forwarded, logged, or persisted -- which matters more with
  // Resend than it did with SMTP, because Resend stores message bodies and
  // surfaces them in its dashboard.
  //
  // Strip CR/LF before the name is interpolated into the Subject header, and
  // cap its length: a crafted name can otherwise inject extra headers.
  const name = sanitizeHeader(body?.name?.toString() ?? "");
  const email = (body?.email?.toString() ?? "").trim();

  // Previously both fields defaulted to "Unknown" and mail was sent anyway,
  // so a blank or malformed submission produced an unactionable lead.
  if (!name || !isValidEmail(email)) {
    return NextResponse.json(
      { error: "A name and a valid email address are required." },
      { status: 400 }
    );
  }

  try {
    await resend.emails.send({
      from: "Nurse Erica Chatbot <onboarding@resend.dev>",
      to: TO_EMAIL,
      subject: `New Aesthetic Lead from ${name}`,
      text: `Name: ${name}\nEmail: ${email}`,
    });

    // The Resend response is not echoed back: it carries message ids and
    // provider detail the caller has no need for.
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Email send error:", err);
    return NextResponse.json(
      { error: "Failed to send email." },
      { status: 500 }
    );
  }
}
