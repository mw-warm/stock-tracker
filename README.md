# Finance Dashboard

Interactive financial planning dashboards built with React + Vite.

## Dashboards

- **$1M Portfolio Dashboard** — Full allocation across 6 asset tiers, 5-year projection, cash flow analysis, and tier drill-downs
- **$120k + Boxster Projection** — Portfolio scenarios with Porsche Boxster GTS 4.0 factored in

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:5173/finance-dashboard/

## Deployment (GitHub Pages)

### One-time setup

1. Push this repo to GitHub
2. Go to **Settings → Pages → Source** and set to `gh-pages` branch
3. That's it — GitHub Actions handles everything from here

### Auto-deploy

Every push to `main` automatically builds and deploys via the included GitHub Actions workflow (`.github/workflows/deploy.yml`).

Your live URL will be:
```
https://<your-username>.github.io/finance-dashboard/
```

### Manual deploy (alternative)

```bash
npm run deploy
```

## Important

> This dashboard is for **illustrative purposes only** and does not constitute financial advice.
> Consult a fee-only fiduciary advisor for personalized guidance.

## Tech Stack

- [React 18](https://react.dev)
- [Vite](https://vitejs.dev)
- [Recharts](https://recharts.org)
- [GitHub Pages](https://pages.github.com)
