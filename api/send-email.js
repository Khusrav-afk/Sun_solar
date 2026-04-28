import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, phone, telegram, device, type } = req.body;

  try {
    // 1. Уведомление тебе (на твою почту)
    await resend.emails.send({
      from: 'SolarMiner <noreply@sunsolarminer.com>',
      to: 'Mmmagicmkr@gmail.com',
      subject: `📋 Новая заявка — ${type === 'preorder' ? 'Предзаказ' : 'Заявка'} — ${name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#0C1A2E;">📋 Новая заявка с сайта SolarMiner</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#64748B;">Имя</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">${name}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#64748B;">Email</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">${email}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#64748B;">Телефон</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">${phone || '—'}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#64748B;">Telegram</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">${telegram || '—'}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#64748B;">Устройство</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">${device || '—'}</td></tr>
            <tr><td style="padding:8px;color:#64748B;">Тип</td><td style="padding:8px;font-weight:600;">${type === 'preorder' ? 'Предзаказ' : 'Заявка'}</td></tr>
          </table>
        </div>
      `
    });

    // 2. Подтверждение клиенту
    await resend.emails.send({
      from: 'SolarMiner <noreply@sunsolarminer.com>',
      to: email,
      subject: '✅ Ваша заявка принята — SolarMiner',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#0C1A2E;">Здравствуйте, ${name}!</h2>
          <p style="color:#334155;line-height:1.6;">Ваша заявка на <strong>${device || 'SolarMiner'}</strong> успешно принята.</p>
          <p style="color:#334155;line-height:1.6;">Мы свяжемся с вами в ближайшее время для подтверждения деталей.</p>
          <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0;">
          <p style="color:#64748B;font-size:13px;">По вопросам: <a href="mailto:support@sunsolarminer.com" style="color:#0EA5E9;">support@sunsolarminer.com</a></p>
          <p style="color:#94A3B8;font-size:12px;">© 2026 SolarMiner · Green Sun Solar Ltd</p>
        </div>
      `
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Resend error:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
