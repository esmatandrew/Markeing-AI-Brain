// Vercel Serverless Function — proxies the Formulary Analyst's requests to
// Google's Gemini API so the API key never reaches the browser.
//
// Setup on Vercel:
//   1. Project Settings → Environment Variables → add GEMINI_API_KEY
//      (get a key from Google AI Studio: https://aistudio.google.com/apikey)
//   2. Redeploy. That's it — no other config needed, Vercel auto-detects
//      anything under /api as a serverless function.
//
// The browser side (index.html) sends { system, tools, contents } to
// /api/chat instead of calling generativelanguage.googleapis.com directly.
// This function assembles the actual Gemini generateContent request (adding
// systemInstruction and generationConfig), attaches the key, and relays the
// response back — reshaped just enough that index.html's existing
// data.error / data.candidates handling keeps working unchanged.

const MODEL = 'gemini-3.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: { message: 'Method not allowed, use POST' } });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: {
        message:
          'GEMINI_API_KEY is not set on the server. Add it in Vercel → Project Settings → Environment Variables, then redeploy.'
      }
    });
    return;
  }

  const { system, tools, contents } = req.body || {};

  try {
    const geminiRes = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents,
        tools,
        systemInstruction: system ? { parts: [{ text: system }] } : undefined,
        generationConfig: { maxOutputTokens: 1400 }
      })
    });

    const data = await geminiRes.json();

    // Surface Gemini's error shape the same way the old Anthropic proxy did,
    // so index.html's `if(data.error)` check keeps working untouched.
    if (!geminiRes.ok) {
      res.status(geminiRes.status).json({
        error: { message: data?.error?.message || 'Gemini API request failed' }
      });
      return;
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ error: { message: 'Could not reach Gemini API: ' + err.message } });
  }
}
