import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (message.length > 1000) {
      return NextResponse.json({ error: 'Message must be 1000 characters or fewer' }, { status: 400 });
    }

    const fromLabel = name?.trim() || 'Anonymous';
    const replyInfo = email?.trim() ? `<p><strong>Reply to:</strong> ${email.trim()}</p>` : '';

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'kacperkurowski0521@gmail.com',
      subject: `New suggestion from ${fromLabel}`,
      html: `
        <h2>New Suggestion — Living Labs</h2>
        <p><strong>From:</strong> ${fromLabel}</p>
        ${replyInfo}
        <hr />
        <p>${message.trim().replace(/\n/g, '<br />')}</p>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to send suggestion';
    console.error('❌ suggestion route error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
