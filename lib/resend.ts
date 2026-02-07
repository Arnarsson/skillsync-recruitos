import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOutreachEmail({
  to,
  subject,
  body,
  from,
}: {
  to: string;
  subject: string;
  body: string;
  from?: string;
}) {
  const fromAddress = from || process.env.RESEND_FROM_EMAIL || 'outreach@recruitos.xyz';

  const { data, error } = await resend.emails.send({
    from: fromAddress,
    to,
    subject,
    html: body,
  });

  if (error) throw new Error(`Email send failed: ${error.message}`);
  return data;
}
