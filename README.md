# Formulary Brain — GNP Market Intelligence

An AI-powered business development tool built on your Business Development Standard Sheet (42,246 SKU records, Egypt, 2021–2026 YTD).

## What it does

- **Opportunity Leaderboard** — auto-scores every ATC4 category on growth (CAGR 2021→2025), fragmentation (HHI), and whether GNP is already present, and surfaces the top white-space opportunities as stamped index cards.
- **Market Explorer** — filter/rank the full dataset by ATC4 category, molecule, corporation, product, or dosage form; sort by value, growth, YoY, fragmentation, or competitor count; click any row for a 6-year trend chart.
- **AI Formulary Analyst** — a chat panel with real tool access to the dataset. It doesn't summarize a snapshot — every answer is backed by a live aggregation query it runs against all 42,246 records (via two tools: `search_terms` to find exact category/molecule/company names, and `analyze_market` to aggregate value, CAGR, YoY growth, HHI, and competitor count). It always cites the real numbers it pulled, and flags 2026 figures as year-to-date.

## Files

- `index.html` — the full application (dashboard + AI chat), single file.
- `data.json` — the dataset, converted from your Excel sheet into a compact, dictionary-encoded format the app loads at runtime (5.6 MB — compresses to roughly 1–1.5 MB over gzip, which both Netlify and Vercel apply automatically).
- `api/chat.js` — a serverless function that holds your Anthropic API key server-side and proxies the AI Analyst's requests. Needed on any real deployment (Vercel, Netlify, etc.) — the browser never calls Anthropic directly outside Claude's own environment.
- `vercel.json` — optional, just sets a cache header on `data.json`. Safe to delete if you're not using Vercel.

## Deploy on Vercel (recommended if you're using the API function)

1. Put `index.html`, `data.json`, `api/chat.js`, and `vercel.json` in one folder — keep the `api/` folder structure as-is, Vercel auto-detects anything under `/api` as a serverless function.
2. Push it to a GitHub repo, then **Import Project** on vercel.com and point it at that repo. (Or `vercel deploy` from the CLI if you'd rather skip GitHub.)
3. In the Vercel project → **Settings → Environment Variables**, add `ANTHROPIC_API_KEY` with your key, then redeploy so the function picks it up.
4. Done — the dashboard, Opportunity Leaderboard, and AI Analyst panel all work end-to-end. `index.html` already points at `/api/chat` instead of calling Anthropic directly.

## Deploy on Netlify instead

Same idea, different function folder. Netlify Functions live under `netlify/functions/` rather than `/api/`, and it reads the key from `ANTHROPIC_API_KEY` the same way via **Site settings → Environment variables**. If you want to go this route, say so and I'll restructure `api/chat.js` into a Netlify Function — the logic itself doesn't change, just the file location and the export format (`exports.handler` instead of Vercel's `export default`).

## Running inside Claude's environment

No setup needed — `index.html` as originally built called `api.anthropic.com` directly and worked immediately, because Claude's environment handles the key for you. The version here is the "take it outside Claude" version, wired for Vercel.

## Updating the data

When you refresh the Business Development Standard Sheet, re-run the same Excel → `data.json` conversion (ask me to regenerate it from a new upload) and redeploy. The app doesn't touch the Excel file directly — everything client-side reads from `data.json`.

## Notes on the numbers

- All values are EGP local currency, exactly as they appear in your sheet's `LC Value` columns.
- **2026 is partial-year (YTD).** The app never averages it into CAGR or YoY growth — it's shown separately and labeled everywhere it appears.
- **HHI** (Herfindahl-Hirschman Index, 0–10,000) measures how concentrated a category is among corporations in 2025. Below ~1,500 = fragmented/competitive; above ~2,500 = concentrated, often a near-monopoly.
- **GNP detection** is based on the corporation label containing "NAPI" (matches "GLOBAL NAPI*" in your data). If GNP's naming in the sheet ever changes, that one check in `index.html` (`isGnpCorpLabel`) needs a matching update.
- The opportunity score weights growth 45%, fragmentation 30%, and GNP's absence 25% — tunable in `computeOpportunities()` in `index.html` if you want to weight differently (e.g. prioritize pure market size instead).
