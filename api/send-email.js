export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, phone, device, comment, type } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'Email service not configured' });
  }

  try {
    // Письмо менеджеру
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'SolarMiner <onboarding@resend.dev>',
        to: ['Mmmagicmkr@gmail.com'],
        subject: `📋 Новая заявка на предзаказ от ${name}`,
        html: `
          <h2>Новая заявка на предзаказ!</h2>
          <table style="border-collapse:collapse;width:100%">
            <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Имя</td><td style="padding:8px;border:1px solid #eee">${name}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Email</td><td style="padding:8px;border:1px solid #eee">${email}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Телефон</td><td style="padding:8px;border:1px solid #eee">${phone || '—'}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Устройство</td><td style="padding:8px;border:1px solid #eee">${device || '—'}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Комментарий</td><td style="padding:8px;border:1px solid #eee">${comment || '—'}</td></tr>
          </table>
        `
      })
    });

    // Письмо клиенту
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'SolarMiner <onboarding@resend.dev>',
        to: [email],
        subject: '✅ Ваша заявка принята — SolarMiner',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
            <div style="background:#0C1A2E;padding:24px;border-radius:12px 12px 0 0;text-align:center">
              <h1 style="color:#F59E0B;margin:0;font-size:24px">SolarMiner</h1>
              <p style="color:rgba(255,255,255,0.6);margin:4px 0 0;font-size:12px">by Green Sun Solar Ltd</p>
            </div>
            <div style="background:#f8fafc;padding:32px;border-radius:0 0 12px 12px">
              <h2 style="color:#0C1A2E;margin-top:0">Здравствуйте, ${name}!</h2>
              <p style="color:#475569">Ваша заявка на предзаказ <strong>${device || 'SolarMiner'}</strong> успешно принята.</p>
              <p style="color:#475569">Наш менеджер свяжется с вами в течение <strong>24 часов</strong> для подтверждения заказа и обсуждения деталей оплаты.</p>
              <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin:24px 0">
                <p style="margin:0;color:#64748B;font-size:13px">По вопросам пишите на</p>
                <a href="mailto:support@sunsolar.pro" style="color:#F59E0B;font-weight:bold">support@sunsolar.pro</a>
              </div>
              <p style="color:#94a3b8;font-size:12px;margin-bottom:0">С уважением, команда SolarMiner · Green Sun Solar Ltd · Reg. No. 13176100</p>
            </div>
          </div>
        `
      })
    });

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Email error:', err);
    return res.status(500).json({ error: 'Email sending failed' });
  }
}
