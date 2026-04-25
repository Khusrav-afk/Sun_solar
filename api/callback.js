import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body;

    // Верификация подписи CryptoCloud
    const secret = process.env.CRYPTOCLOUD_SECRET;
    if (secret && data.token) {
      const expectedToken = crypto
        .createHmac('sha256', secret)
        .update(data.invoice_id)
        .digest('hex');

      if (data.token !== expectedToken) {
        console.error('Invalid webhook signature');
        return res.status(403).json({ error: 'Invalid signature' });
      }
    }

    const status = data.status; // 'success' | 'fail' | 'partial'
    const orderId = data.order_id;
    const amount = data.amount_crypto;
    const currency = data.currency;
    const invoiceId = data.invoice_id;

    console.log(`Payment callback: ${status} | order: ${orderId} | amount: ${amount} ${currency}`);

    // Отправить email при успешной оплате
    if (status === 'success' && process.env.RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'SolarMiner <onboarding@resend.dev>',
          to: ['Mmmagicmkr@gmail.com'],
          subject: `✅ Оплата подтверждена! Заказ ${orderId}`,
          html: `
            <h2>Оплата подтверждена!</h2>
            <table style="border-collapse:collapse;width:100%">
              <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Заказ №</td><td style="padding:8px;border:1px solid #eee">${orderId}</td></tr>
              <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Инвойс</td><td style="padding:8px;border:1px solid #eee">${invoiceId}</td></tr>
              <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Сумма</td><td style="padding:8px;border:1px solid #eee;color:#22C55E;font-weight:bold">${amount} ${currency}</td></tr>
              <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Статус</td><td style="padding:8px;border:1px solid #eee;color:#22C55E">✅ Оплачено</td></tr>
            </table>
          `
        })
      });
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('Callback error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
