import { Resend } from "resend";

function requireEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing ${name} environment variable`);
  }
  return value;
}

type BookingEmailPayload = {
  to: string;
  roomName: string;
  organizationName: string;
  startAt: Date;
  endAt: Date;
  pin?: string;
  qrToken?: string;
};

type LoginPinEmailPayload = {
  to: string;
  pin: string;
  expiresAt: Date;
};

function formatRange(startAt: Date, endAt: Date) {
  return `${startAt.toLocaleString()} - ${endAt.toLocaleString()}`;
}

function wrapContent(html: string) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin: 0 0 12px;">Conference Room Booking</h2>
      ${html}
      <p style="color:#6b7280;">This is an automated message.</p>
    </div>
  `;
}

async function sendEmail(subject: string, to: string, html: string) {
  const apiKey = requireEnv(process.env.RESEND_API_KEY, "RESEND_API_KEY");
  const from = requireEnv(process.env.RESEND_FROM, "RESEND_FROM");
  const resend = new Resend(apiKey);

  await resend.emails.send({
    from,
    to,
    subject,
    html,
  });
}

export async function sendBookingCreatedEmail(payload: BookingEmailPayload) {
  const range = formatRange(payload.startAt, payload.endAt);
  const qrInfo = payload.qrToken
    ? `<p><strong>QR token:</strong> ${payload.qrToken}</p>`
    : "";
  const pinInfo = payload.pin ? `<p><strong>PIN:</strong> ${payload.pin}</p>` : "";

  await sendEmail(
    "Booking confirmed",
    payload.to,
    wrapContent(`
      <p>Your booking is confirmed.</p>
      <p><strong>Organization:</strong> ${payload.organizationName}</p>
      <p><strong>Room:</strong> ${payload.roomName}</p>
      <p><strong>Time:</strong> ${range}</p>
      ${pinInfo}
      ${qrInfo}
    `),
  );
}

export async function sendBookingCanceledEmail(payload: BookingEmailPayload) {
  const range = formatRange(payload.startAt, payload.endAt);

  await sendEmail(
    "Booking canceled",
    payload.to,
    wrapContent(`
      <p>Your booking has been canceled.</p>
      <p><strong>Organization:</strong> ${payload.organizationName}</p>
      <p><strong>Room:</strong> ${payload.roomName}</p>
      <p><strong>Time:</strong> ${range}</p>
    `),
  );
}

export async function sendLoginPinEmail(payload: LoginPinEmailPayload) {
  await sendEmail(
    "Your sign-in PIN",
    payload.to,
    wrapContent(`
      <p>Use the PIN below to sign in.</p>
      <p style="font-size: 24px; letter-spacing: 4px; font-weight: 700;">
        ${payload.pin}
      </p>
      <p><strong>Expires at:</strong> ${payload.expiresAt.toLocaleString()}</p>
    `),
  );
}
