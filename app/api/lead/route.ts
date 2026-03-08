import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const TO_EMAIL  = process.env.BUSINESS_EMAIL;

export async function POST(req: NextRequest) {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !TO_EMAIL) {
    return NextResponse.json(
      { error: "Email server is not configured." },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => null);
  const name = body?.name?.toString() || "Unknown";
  const email = body?.email?.toString() || "Unknown";
  const context = body?.context?.toString() || "";

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: SMTP_USER,
      to: TO_EMAIL,
      subject: `New Aesthetic Lead from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nConversation snippet:\n${context}`
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Email send error:", err);
    return NextResponse.json(
      { error: "Failed to send email." },
      { status: 500 }
    );
  }
}
