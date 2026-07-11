// Vercel Serverless Function — proxies the Formulary Analyst's requests to
// Anthropic's Messages API so the API key never reaches the browser.
//
// Setup on Vercel:
//   1. Project Settings → Environment Variables → add ANTHROPIC_API_KEY
//   2. Redeploy. That's it — no other config needed, Vercel auto-detects
//      anything under /api as a serverless function.
//
// The browser side (index.html) sends the exact same JSON body it always
// did (model, max_tokens, system, tools, messages) to /api/chat instead of
// api.anthropic.com directly. This function just forwards it with the key
// attached and relays the response back untouched.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: { message: 'Method not allowed, use POST' } });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: {
        message:
          'ANTHROPIC_API_KEY is not set on the server. Add it in Vercel → Project Settings → Environment Variables, then redeploy.'
      }
    });
    return;
  }

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    });

    const data = await anthropicRes.json();
    res.status(anthropicRes.status).json(data);
  } catch (err) {
    res.status(502).json({ error: { message: 'Could not reach Anthropic API: ' + err.message } });
  }
}
