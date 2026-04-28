export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, email, name, device } = req.body;

  if (!amount || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const response = await fetch('https://api.cryptocloud.plus/v2/invoice/create', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.CRYPTOCLOUD_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        shop_id: process.env.CRYPTOCLOUD_SHOP_ID,
        amount: amount,
        order_id: `order_${Date.now()}`,
        email: email,
        add_fields: {
          customer_name: name,
          device: device
        }
      })
    });

    const data = await response.json();

    if (data.status === 'success' && data.result?.link) {
      // Отправить уведомление на почту менеджера
      await notifyManager({ name, email, device, amount });
      return res.status(200).json({ pay_url: data.result.link });
    } else {
      console.error('CryptoCloud error:', data);
      return res.status(500).json({ error: 'Payment creation failed', details: data });
    }

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

// Уведомление менеджера через email
async function notifyManager({ name, email, device, amount }) {
  if (!process.env.RESEND_API_KEY) return;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'SolarMiner <noreply@sunsolarminer.com>',
      to: ['bhusrav59@gmail.com'],
      subject: `💰 Новый заказ от ${name} — $${amount}`,
      html: `
        <h2>Новый заказ на SolarMiner!</h2>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Имя</td><td style="padding:8px;border:1px solid #eee">${name}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Email</td><td style="padding:8px;border:1px solid #eee">${email}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Устройство</td><td style="padding:8px;border:1px solid #eee">${device}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Сумма</td><td style="padding:8px;border:1px solid #eee;color:#F59E0B;font-size:18px">$${amount}</td></tr>
        </table>
        <p style="color:#666;margin-top:16px">Клиент перешёл к оплате через CryptoCloud</p>
      `
    })
  });
}
