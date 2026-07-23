// Cloudflare Worker — encrypted portfolio sync for the Stock Tracker.
// It stores ONE AES-encrypted blob; the server never sees your holdings in
// plaintext (decryption only happens in your browser, with your password).
//
// SETUP (all in the Cloudflare dashboard — no command line):
//   1. Create a free account at https://dash.cloudflare.com
//   2. Workers & Pages → Create → Workers → name it (e.g. "stock-sync") → Deploy
//   3. Open the Worker → Edit code → paste THIS file → Deploy
//   4. Storage & Databases → KV → Create a namespace (e.g. "PORTFOLIO")
//   5. Worker → Settings → Bindings → Add → KV namespace:
//        Variable name:  PORTFOLIO_KV     Namespace: (the one you made)
//   6. Worker → Settings → Variables and Secrets → Add secret:
//        Name:  WRITE_TOKEN     Value: (make up a long random string)
//   7. Copy the Worker URL (like https://stock-sync.YOURNAME.workers.dev)
//   8. Send me the Worker URL and the WRITE_TOKEN — I'll wire the dashboard to it.

const KEY = 'portfolio';

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Write-Token',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

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
