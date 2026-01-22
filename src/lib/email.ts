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

function formatRange(startAt: Date, endAt: Date) {
  return `${startAt.toLocaleString()} - ${endAt.toLocaleString()}`;
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
    `
      <p>Your booking is confirmed.</p>
      <p><strong>Organization:</strong> ${payload.organizationName}</p>
      <p><strong>Room:</strong> ${payload.roomName}</p>
      <p><strong>Time:</strong> ${range}</p>
      ${pinInfo}
      ${qrInfo}
    `,
  );
}

export async function sendBookingCanceledEmail(payload: BookingEmailPayload) {
  const range = formatRange(payload.startAt, payload.endAt);

  await sendEmail(
    "Booking canceled",
    payload.to,
    `
      <p>Your booking has been canceled.</p>
      <p><strong>Organization:</strong> ${payload.organizationName}</p>
      <p><strong>Room:</strong> ${payload.roomName}</p>
      <p><strong>Time:</strong> ${range}</p>
    `,
  );
}
