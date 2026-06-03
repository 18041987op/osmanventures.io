import { Resend } from "resend";

// Where the message is delivered, and the verified sender address.
// Configure these in your environment (e.g. Vercel project settings).
const TO_EMAIL = process.env.CONTACT_TO_EMAIL ?? "osman@osmanventures.io";
const FROM_EMAIL =
  process.env.CONTACT_FROM_EMAIL ?? "Osman Ventures <onboarding@resend.dev>";

const MAX_NAME = 100;
const MAX_EMAIL = 200;
const MAX_MESSAGE = 5000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  message?: unknown;
  // Honeypot field — real users never fill this in.
  company?: unknown;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function POST(request: Request) {
  let body: ContactPayload;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 }
    );
  }

  // Honeypot: if filled, silently accept without sending (bot trap).
  if (typeof body.company === "string" && body.company.trim().length > 0) {
    return Response.json({ ok: true });
  }

  const name = isNonEmptyString(body.name) ? body.name.trim() : "";
  const email = isNonEmptyString(body.email) ? body.email.trim() : "";
  const message = isNonEmptyString(body.message) ? body.message.trim() : "";

  if (!name || !email || !message) {
    return Response.json(
      { ok: false, error: "Name, email, and message are required." },
      { status: 400 }
    );
  }

  if (!EMAIL_RE.test(email)) {
    return Response.json(
      { ok: false, error: "Please provide a valid email address." },
      { status: 400 }
    );
  }

  if (
    name.length > MAX_NAME ||
    email.length > MAX_EMAIL ||
    message.length > MAX_MESSAGE
  ) {
    return Response.json(
      { ok: false, error: "One or more fields are too long." },
      { status: 400 }
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not configured.");
    return Response.json(
      { ok: false, error: "Email service is not configured." },
      { status: 500 }
    );
  }

  const resend = new Resend(apiKey);

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      replyTo: email,
      subject: `New message from ${name} — osmanventures.io`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    });

    if (error) {
      console.error("Resend error:", error);
      return Response.json(
        { ok: false, error: "Failed to send message. Please try again." },
        { status: 502 }
      );
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("Unexpected error sending contact email:", err);
    return Response.json(
      { ok: false, error: "Failed to send message. Please try again." },
      { status: 500 }
    );
  }
}
