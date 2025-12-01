// netlify/functions/create-order.js
export async function handler(event, context) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const body = JSON.parse(event.body || '{}');
    const amount = body.amount;
    if (!amount || amount <= 0) return { statusCode: 400, body: JSON.stringify({ error: 'Invalid amount' }) };

    const keyId = process.env.RZP_KEY_ID;
    const keySecret = process.env.RZP_KEY_SECRET;
    if (!keyId || !keySecret) return { statusCode: 500, body: JSON.stringify({ error: 'Payment keys not configured' }) };

    const payload = { amount: amount, currency: 'INR', receipt: body.receipt || `rcpt_${Date.now()}`, payment_capture: 1 };
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const resp = await fetch('https://api.razorpay.com/v1/orders', {
      method:'POST',
      headers:{ 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await resp.json();
    if (!resp.ok) return { statusCode: 500, body: JSON.stringify({ error: data }) };

    return { statusCode:200, body: JSON.stringify({ order: { id: data.id, amount: data.amount, currency: data.currency } }) };
  } catch (err) {
    return { statusCode:500, body: JSON.stringify({ error: err.message }) };
  }
}