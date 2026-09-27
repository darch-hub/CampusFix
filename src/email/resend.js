import { Resend } from "resend";

let client = null;
function resend() {
  if (client) return client;
  if (!process.env.RESEND_API_KEY) return null;
  client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

// Fire-and-forget notifier: logs when unconfigured so the prototype works without keys.
export async function sendStatusEmail({ to, subject, html }) {
  const api = resend();
  if (!api) {
    console.log(`[email:stub] to=${to} subject=${subject}`);
    return { stubbed: true };
  }
  const { data, error } = await api.emails.send({ from: process.env.EMAIL_FROM, to, subject, html });
  if (error) {
    console.error("[email:error]", error);
    return { error };
  }
  return { id: data?.id };
}
