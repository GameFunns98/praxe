export async function sendPasswordResetEmail(input: { to: string; resetUrl: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.PASSWORD_RESET_FROM_EMAIL;

  if (!apiKey || !from) {
    console.info(`[Email] Password reset fallback log for ${input.to}: ${input.resetUrl}`);
    return { delivered: false as const, reason: 'EMAIL_NOT_CONFIGURED' };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: 'Reset hesla — EMS Praxe',
      html: `<p>Dobrý den,</p><p>pro reset hesla klikněte na odkaz níže:</p><p><a href="${input.resetUrl}">${input.resetUrl}</a></p><p>Odkaz je platný 2 hodiny.</p>`
    })
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('[Email] Resend send failed', text);
    return { delivered: false as const, reason: 'EMAIL_SEND_FAILED' };
  }

  return { delivered: true as const };
}
