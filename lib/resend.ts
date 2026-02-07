import { Resend } from 'resend';

let _resend: Resend | null = null;

function getResend() {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error('RESEND_API_KEY is not set');
    _resend = new Resend(key);
  }
  return _resend;
}

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

  const { data, error } = await getResend().emails.send({
    from: fromAddress,
    to,
    subject,
    html: body,
  });

  if (error) throw new Error(`Email send failed: ${error.message}`);
  return data;
}
