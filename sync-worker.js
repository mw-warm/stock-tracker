// Cloudflare Worker — encrypted portfolio sync + live-price proxy for the tracker.
//
//  • GET  /                → returns the stored encrypted portfolio blob (KV)
//  • POST /                → stores the encrypted portfolio blob (needs WRITE_TOKEN)
//  • GET  /proxy?url=<...>  → fetches a Yahoo Finance URL server-side and returns it
//                            with CORS headers (so the browser can read live prices)
//
// It never sees your holdings in plaintext, and the /proxy endpoint is locked to
// Yahoo Finance hosts only (not an open proxy).
//
// SETUP RECAP (Cloudflare dashboard): Worker with a KV binding named PORTFOLIO_KV
// and a secret WRITE_TOKEN. To update: open the Worker → Edit code → paste this →
// Deploy.

const KEY = 'portfolio';
const ALLOWED = /^https:\/\/query[12]\.finance\.yahoo\.com\//;

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Write-Token',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    const url = new URL(request.url);

    // --- Live-price proxy (Yahoo Finance only), with internal retry ---
    if (url.pathname === '/proxy') {
      const target = url.searchParams.get('url') || '';
      if (!ALLOWED.test(target)) return new Response('Forbidden', { status: 403, headers: cors });
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const r = await fetch(target, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
            cf: { cacheTtl: 20 }, // cache the successful upstream response briefly
          });
          const body = await r.text();
          if (r.ok && body && body.indexOf('"chart"') !== -1) {
            return new Response(body, { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } });
          }
        } catch (e) { /* retry */ }
        await new Promise(res => setTimeout(res, 300));
      }
      return new Response('{"error":"upstream unavailable"}', { status: 502, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    // --- Encrypted portfolio storage ---
    if (request.method === 'GET') {
      const val = await env.PORTFOLIO_KV.get(KEY);
      return new Response(val || '', { headers: { ...cors, 'Content-Type': 'application/json' } });
    }
    if (request.method === 'POST') {
      if (env.WRITE_TOKEN && request.headers.get('X-Write-Token') !== env.WRITE_TOKEN) {
        return new Response('Forbidden', { status: 403, headers: cors });
      }
      const body = await request.text();
      if (body.length > 200000) return new Response('Too large', { status: 413, headers: cors });
      await env.PORTFOLIO_KV.put(KEY, body);
      return new Response('ok', { headers: cors });
    }

    return new Response('Method not allowed', { status: 405, headers: cors });
  },
};
