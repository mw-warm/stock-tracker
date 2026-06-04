import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

// ── CONSTANTS ──────────────────────────────────────────────────────────────
const TOTAL_CAPITAL = 1026000; // 1M + 26k BMW sale
const BOXSTER_PRICE = 87000;
const DOWN_PAYMENT = 17400; // 20%
const AUTO_LOAN = BOXSTER_PRICE - DOWN_PAYMENT;
const AUTO_RATE = 0.06;
const AUTO_MONTHS = 60;
const MONTHLY_CAR = (AUTO_LOAN * (AUTO_RATE / 12)) / (1 - Math.pow(1 + AUTO_RATE / 12, -AUTO_MONTHS));
const NET_INVESTED = TOTAL_CAPITAL - DOWN_PAYMENT; // ~1,008,600

// ── ALLOCATION ─────────────────────────────────────────────────────────────
const TIERS = [
  {
    id: "liquidity",
    label: "Liquidity & Safety",
    pct: 0.10,
    color: "#94a3b8",
    annualReturn: 0.049,
    incomeRate: 0.049,
    bearReturn: 0.035,
    bullReturn: 0.055,
    holdings: [
      { name: "HYSA / Money Market", amount: 50000, yield: "4.8%", notes: "Emergency buffer, instant access" },
      { name: "T-Bills SGOV", amount: 50600, yield: "5.0%", notes: "3-6 month rolling, monthly payout" },
    ],
  },
  {
    id: "growth",
    label: "Core Growth",
    pct: 0.35,
    color: "#f59e0b",
    annualReturn: 0.162,
    incomeRate: 0.008,
    bearReturn: -0.18,
    bullReturn: 0.32,
    holdings: [
      { name: "QQQ", amount: 151290, yield: "0.6%", notes: "Nasdaq 100 core — hold in taxable for LTCG" },
      { name: "VGT / SCHG", amount: 75645, yield: "0.5%", notes: "Broad tech growth ETF" },
      { name: "Individual stocks", amount: 75645, yield: "1.5%", notes: "5-8 high conviction picks" },
      { name: "International VEA/VWO", amount: 50430, yield: "3.2%", notes: "Diversification hedge" },
    ],
  },
  {
    id: "income",
    label: "Income Generation",
    pct: 0.25,
    color: "#10b981",
    annualReturn: 0.073,
    incomeRate: 0.073,
    bearReturn: 0.025,
    bullReturn: 0.10,
    holdings: [
      { name: "JEPI", amount: 75645, yield: "8.0%", notes: "Hold in IRA — shields 37% tax" },
      { name: "Muni Bond ETF MUB", amount: 75645, yield: "4.0% tax-free", notes: "~6.3% tax-equivalent at 37%" },
      { name: "BDCs MAIN/ARCC", amount: 50430, yield: "10.0%", notes: "High yield, hold in IRA" },
      { name: "Preferred Stock PFF", amount: 50430, yield: "6.5%", notes: "Stable income, IRA preferred" },
    ],
  },
  {
    id: "realestate",
    label: "Real Estate",
    pct: 0.15,
    color: "#8b5cf6",
    annualReturn: 0.10,
    incomeRate: 0.055,
    bearReturn: -0.05,
    bullReturn: 0.18,
    holdings: [
      { name: "Fundrise / Crowdstreet", amount: 50430, yield: "8-12%", notes: "Private RE — accredited investor access" },
      { name: "Public REITs O/VICI", amount: 50430, yield: "5.5%", notes: "Liquid, monthly dividends — hold in IRA" },
      { name: "STR down payment", amount: 50430, yield: "15-25% CoC", notes: "Depreciation offsets 37% ordinary income" },
    ],
  },
  {
    id: "private",
    label: "Private Credit & Alts",
    pct: 0.10,
    color: "#ec4899",
    annualReturn: 0.11,
    incomeRate: 0.11,
    bearReturn: 0.03,
    bullReturn: 0.18,
    holdings: [
      { name: "Yieldstreet / Percent", amount: 40344, yield: "10-15%", notes: "Private credit, accredited only" },
      { name: "PIMCO PCMIX interval", amount: 35301, yield: "8-10%", notes: "Institutional-grade credit" },
      { name: "AngelList Venture", amount: 25215, yield: "Illiquid", notes: "5-10yr, home run potential" },
    ],
  },
  {
    id: "crypto",
    label: "Crypto",
    pct: 0.05,
    color: "#f97316",
    annualReturn: 0.20,
    incomeRate: 0.03,
    bearReturn: -0.50,
    bullReturn: 0.80,
    holdings: [
      { name: "Bitcoin BTC", amount: 30258, yield: "0%", notes: "Hold 1+ year for LTCG rate (20% vs 37%)" },
      { name: "Ethereum ETH", amount: 15129, yield: "3-4%", notes: "Staking yield" },
      { name: "Stablecoin USDC", amount: 5043, yield: "5-8%", notes: "Coinbase yield" },
    ],
  },
];

// weighted blended return
const BLENDED_BASE = TIERS.reduce((s, t) => s + t.pct * t.annualReturn, 0);
const BLENDED_BEAR = TIERS.reduce((s, t) => s + t.pct * t.bearReturn, 0);
const BLENDED_BULL = TIERS.reduce((s, t) => s + t.pct * t.bullReturn, 0);
const BLENDED_INCOME = TIERS.reduce((s, t) => s + t.pct * t.incomeRate, 0);

function buildProjection(years = 5) {
  const rows = [];
  let base = NET_INVESTED, bear = NET_INVESTED, bull = NET_INVESTED;
  let loanBal = AUTO_LOAN;
  const carStart = BOXSTER_PRICE;

  for (let y = 0; y <= years; y++) {
    if (y > 0) {
      base *= (1 + BLENDED_BASE);
      bear *= (1 + BLENDED_BEAR);
      bull *= (1 + BLENDED_BULL);
      for (let m = 0; m < 12; m++) {
        const int = loanBal * (AUTO_RATE / 12);
        loanBal = Math.max(0, loanBal - (MONTHLY_CAR - int));
      }
    }
    const carVal = carStart * Math.pow(0.88, y);
    const annualIncome = base * BLENDED_INCOME;
    rows.push({
      year: y,
      base: Math.round(base),
      bear: Math.round(bear),
      bull: Math.round(bull),
      carVal: Math.round(carVal),
      loanBal: Math.round(loanBal),
      netBase: Math.round(base + carVal - loanBal),
      netBear: Math.round(bear + carVal - loanBal),
      netBull: Math.round(bull + carVal - loanBal),
      annualIncome: Math.round(annualIncome),
      monthlyIncome: Math.round(annualIncome / 12),
      carPayment: Math.round(MONTHLY_CAR),
      surplus: Math.round(annualIncome / 12 - MONTHLY_CAR),
    });
  }
  return rows;
}

const proj = buildProjection(5);
const fmt = (n) => n >= 1000000 ? `$${(n/1000000).toFixed(2)}M` : `$${n.toLocaleString()}`;
const fmtK = (n) => `$${(n/1000).toFixed(0)}k`;

const PIE_DATA = TIERS.map(t => ({ name: t.label, value: Math.round(NET_INVESTED * t.pct), color: t.color }));

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0f1117", border: "1px solid #1e2435", borderRadius: 10, padding: "10px 14px", fontSize: 12 }}>
      <div style={{ color: "#64748b", marginBottom: 4 }}>Year {label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, marginBottom: 2 }}>{p.name}: {fmt(p.value)}</div>
      ))}
    </div>
  );
};

const TABS = ["Overview", "Allocation", "Projection", "Cash Flow"];

export default function MillionDollarDashboard() {
  const [tab, setTab] = useState("Overview");
  const [activeTier, setActiveTier] = useState(null);

  const tier = activeTier ? TIERS.find(t => t.id === activeTier) : null;
  const annualIncome = Math.round(NET_INVESTED * BLENDED_INCOME);

  return (
    <div style={{
      minHeight: "100vh", background: "#080b12", color: "#e2e8f0",
      fontFamily: "'DM Mono', 'Courier New', monospace", padding: "20px 16px"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #0f1117; }
        ::-webkit-scrollbar-thumb { background: #1e2d40; border-radius: 2px; }
        .tier-card:hover { border-color: var(--c) !important; background: color-mix(in srgb, var(--c) 8%, #0f1117) !important; }
        .tab-btn { transition: all 0.2s; }
        .tab-btn:hover { color: #e2e8f0 !important; }
        .holding-row:hover { background: #0f1825 !important; }
      `}</style>

      {/* Header */}
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, color: "#f8fafc", margin: 0, letterSpacing: -1 }}>
              $1M Portfolio
            </h1>
            <span style={{ fontSize: 11, color: "#334155", background: "#0f1825", padding: "3px 8px", borderRadius: 4, border: "1px solid #1e2d40" }}>
              + PORSCHE BOXSTER GTS 4.0
            </span>
          </div>
          <div style={{ display: "flex", gap: 20, marginTop: 10, flexWrap: "wrap" }}>
            {[
              { label: "NET INVESTED", value: fmt(NET_INVESTED), color: "#f8fafc" },
              { label: "BLENDED RETURN", value: `${(BLENDED_BASE * 100).toFixed(1)}%`, color: "#10b981" },
              { label: "MONTHLY INCOME", value: fmt(Math.round(annualIncome / 12)), color: "#f59e0b" },
              { label: "CAR PAYMENT", value: fmt(Math.round(MONTHLY_CAR)), color: "#ec4899" },
              { label: "MONTHLY SURPLUS", value: fmt(Math.round(annualIncome / 12 - MONTHLY_CAR)), color: "#8b5cf6" },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 9, color: "#475569", letterSpacing: 2 }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 500, color: s.color, fontFamily: "'Syne', sans-serif" }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* BMW → Boxster Bridge */}
        <div style={{ background: "#0a1020", border: "1px solid #1e2d40", borderRadius: 12, padding: "12px 16px", marginBottom: 24, fontSize: 12 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", color: "#64748b" }}>
            <span style={{ color: "#94a3b8" }}>2019 BMW M240i Convertible (manual)</span>
            <span>→ BaT sale</span>
            <span style={{ color: "#10b981" }}>~+$26,000</span>
            <span style={{ color: "#334155" }}>│</span>
            <span style={{ color: "#94a3b8" }}>$1,000,000</span>
            <span>+</span>
            <span style={{ color: "#10b981" }}>$26,000</span>
            <span>=</span>
            <span style={{ color: "#f8fafc" }}>$1,026,000</span>
            <span style={{ color: "#334155" }}>│</span>
            <span>Boxster 20% down</span>
            <span style={{ color: "#ec4899" }}>−$17,400</span>
            <span>=</span>
            <span style={{ color: "#f8fafc", fontWeight: 600 }}>{fmt(NET_INVESTED)} invested</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, marginBottom: 24, background: "#0a0e18", borderRadius: 10, padding: 4, border: "1px solid #1e2d40" }}>
          {TABS.map(t => (
            <button key={t} className="tab-btn" onClick={() => { setTab(t); setActiveTier(null); }} style={{
              flex: 1, padding: "8px 4px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 11, letterSpacing: 1, fontFamily: "'DM Mono', monospace",
              background: tab === t ? "#1e2d40" : "transparent",
              color: tab === t ? "#f8fafc" : "#475569",
            }}>{t.toUpperCase()}</button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {tab === "Overview" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[
                { label: "5-yr Portfolio (Base)", value: fmt(proj[5].base), sub: `+${fmt(proj[5].base - NET_INVESTED)} gain`, color: "#f59e0b" },
                { label: "5-yr Portfolio (Bull)", value: fmt(proj[5].bull), sub: `+${fmt(proj[5].bull - NET_INVESTED)} gain`, color: "#10b981" },
                { label: "5-yr Net Worth (Base)", value: fmt(proj[5].netBase), sub: "incl. Boxster value", color: "#8b5cf6" },
                { label: "5-yr Income (Total)", value: fmt(proj.slice(1).reduce((s,r) => s + r.annualIncome, 0)), sub: "cumulative distributions", color: "#ec4899" },
              ].map(c => (
                <div key={c.label} style={{ background: "#0a0e18", border: "1px solid #1e2d40", borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ fontSize: 9, color: "#475569", letterSpacing: 2, marginBottom: 6 }}>{c.label}</div>
                  <div style={{ fontSize: 22, fontFamily: "'Syne', sans-serif", fontWeight: 700, color: c.color }}>{c.value}</div>
                  <div style={{ fontSize: 11, color: "#334155", marginTop: 3 }}>{c.sub}</div>
                </div>
              ))}
            </div>

            {/* Mini chart */}
            <div style={{ background: "#0a0e18", border: "1px solid #1e2d40", borderRadius: 12, padding: "16px" }}>
              <div style={{ fontSize: 10, color: "#475569", letterSpacing: 2, marginBottom: 14 }}>PORTFOLIO TRAJECTORY · 5 YEARS</div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={proj}>
                  <defs>
                    <linearGradient id="gBull" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gBase" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gBear" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="#0f1825" />
                  <XAxis dataKey="year" tick={{ fill: "#334155", fontSize: 11 }} tickFormatter={v => `Yr ${v}`} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#334155", fontSize: 10 }} tickFormatter={fmtK} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="bull" name="Bull" stroke="#10b981" strokeWidth={1.5} fill="url(#gBull)" dot={false} strokeDasharray="4 2" />
                  <Area type="monotone" dataKey="base" name="Base" stroke="#f59e0b" strokeWidth={2} fill="url(#gBase)" dot={{ fill: "#f59e0b", r: 3 }} />
                  <Area type="monotone" dataKey="bear" name="Bear" stroke="#ef4444" strokeWidth={1.5} fill="url(#gBear)" dot={false} strokeDasharray="4 2" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── ALLOCATION TAB ── */}
        {tab === "Allocation" && !activeTier && (
          <div>
            <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
              <div style={{ flex: "0 0 200px" }}>
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie data={PIE_DATA} cx={100} cy={100} innerRadius={55} outerRadius={90} dataKey="value" strokeWidth={2} stroke="#080b12">
                      {PIE_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ textAlign: "center", marginTop: -10, fontSize: 10, color: "#475569" }}>TAP A TIER FOR HOLDINGS</div>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, minWidth: 180 }}>
                {TIERS.map(t => (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.color, flexShrink: 0 }} />
                    <div style={{ fontSize: 11, color: "#94a3b8", flex: 1 }}>{t.label}</div>
                    <div style={{ fontSize: 11, color: t.color }}>{fmt(Math.round(NET_INVESTED * t.pct))}</div>
                    <div style={{ fontSize: 10, color: "#334155", width: 32, textAlign: "right" }}>{Math.round(t.pct * 100)}%</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {TIERS.map(t => (
                <div key={t.id} className="tier-card" onClick={() => setActiveTier(t.id)} style={{
                  background: "#0a0e18", border: `1px solid #1e2d40`, borderRadius: 12,
                  padding: "14px 16px", cursor: "pointer", transition: "all 0.2s",
                  "--c": t.color,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: t.color, marginBottom: 6 }} />
                      <div style={{ fontSize: 11, fontWeight: 500, color: "#94a3b8" }}>{t.label}</div>
                      <div style={{ fontSize: 18, fontFamily: "'Syne', sans-serif", fontWeight: 700, color: t.color, marginTop: 4 }}>
                        {fmt(Math.round(NET_INVESTED * t.pct))}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 9, color: "#334155", letterSpacing: 1 }}>EST RETURN</div>
                      <div style={{ fontSize: 14, color: "#f8fafc", marginTop: 2 }}>{(t.annualReturn * 100).toFixed(1)}%</div>
                      <div style={{ fontSize: 9, color: "#334155", marginTop: 4 }}>{Math.round(t.pct * 100)}% of portfolio</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: "#334155", marginTop: 8 }}>
                    {t.holdings.length} holdings · {fmt(Math.round(NET_INVESTED * t.pct * t.incomeRate))}/yr income
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tier drill-down */}
        {tab === "Allocation" && activeTier && tier && (
          <div>
            <button onClick={() => setActiveTier(null)} style={{
              background: "none", border: "1px solid #1e2d40", color: "#64748b", borderRadius: 8,
              padding: "6px 14px", cursor: "pointer", fontSize: 11, marginBottom: 16, fontFamily: "'DM Mono', monospace"
            }}>← BACK TO ALLOCATION</button>

            <div style={{ background: "#0a0e18", border: `1px solid ${tier.color}33`, borderRadius: 14, padding: "16px 18px", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 9, color: "#475569", letterSpacing: 2 }}>TIER</div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: tier.color }}>{tier.label}</div>
                </div>
                {[
                  { l: "TOTAL", v: fmt(Math.round(NET_INVESTED * tier.pct)) },
                  { l: "BASE RETURN", v: `${(tier.annualReturn * 100).toFixed(1)}%` },
                  { l: "ANNUAL INCOME", v: fmt(Math.round(NET_INVESTED * tier.pct * tier.incomeRate)) },
                  { l: "BEAR / BULL", v: `${(tier.bearReturn * 100).toFixed(0)}% / ${(tier.bullReturn * 100).toFixed(0)}%` },
                ].map(s => (
                  <div key={s.l}>
                    <div style={{ fontSize: 9, color: "#475569", letterSpacing: 2 }}>{s.l}</div>
                    <div style={{ fontSize: 14, color: "#f8fafc", marginTop: 2 }}>{s.v}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {tier.holdings.map((h, i) => (
                <div key={i} className="holding-row" style={{
                  background: "#0a0e18", border: "1px solid #1e2d40", borderRadius: 10,
                  padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8,
                  transition: "background 0.15s",
                }}>
                  <div>
                    <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 500 }}>{h.name}</div>
                    <div style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>{h.notes}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 15, color: tier.color, fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>{fmt(h.amount)}</div>
                    <div style={{ fontSize: 10, color: "#334155", marginTop: 2 }}>yield {h.yield}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PROJECTION TAB ── */}
        {tab === "Projection" && (
          <div>
            <div style={{ background: "#0a0e18", border: "1px solid #1e2d40", borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: "#475569", letterSpacing: 2, marginBottom: 14 }}>NET WORTH OVER 5 YEARS (PORTFOLIO + BOXSTER − LOAN)</div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={proj}>
                  <defs>
                    <linearGradient id="nBull" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="nBase" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="#0f1825" />
                  <XAxis dataKey="year" tick={{ fill: "#334155", fontSize: 11 }} tickFormatter={v => `Yr ${v}`} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#334155", fontSize: 10 }} tickFormatter={fmtK} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="netBull" name="Bull Net Worth" stroke="#10b981" strokeWidth={1.5} fill="url(#nBull)" dot={false} strokeDasharray="4 2" />
                  <Area type="monotone" dataKey="netBase" name="Base Net Worth" stroke="#8b5cf6" strokeWidth={2} fill="url(#nBase)" dot={{ fill: "#8b5cf6", r: 3 }} />
                  <Area type="monotone" dataKey="netBear" name="Bear Net Worth" stroke="#ef4444" strokeWidth={1.5} fill="none" dot={false} strokeDasharray="4 2" />
                  <Area type="monotone" dataKey="carVal" name="Boxster Value" stroke="#475569" strokeWidth={1} fill="none" dot={false} strokeDasharray="2 6" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ color: "#334155", borderBottom: "1px solid #1e2d40" }}>
                    {["YEAR","PORTFOLIO","INCOME/YR","BOXSTER","LOAN BAL","NET WORTH"].map(h => (
                      <th key={h} style={{ padding: "8px 10px", textAlign: "right", fontWeight: 400, letterSpacing: 1, fontSize: 9 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {proj.map(r => (
                    <tr key={r.year} style={{ borderBottom: "1px solid #0f1825" }}>
                      <td style={{ padding: "10px", color: "#475569", textAlign: "right" }}>{r.year === 0 ? "START" : `YR ${r.year}`}</td>
                      <td style={{ padding: "10px", color: "#f59e0b", textAlign: "right", fontWeight: 500 }}>{fmt(r.base)}</td>
                      <td style={{ padding: "10px", color: "#10b981", textAlign: "right" }}>{r.year === 0 ? "—" : fmt(r.annualIncome)}</td>
                      <td style={{ padding: "10px", color: "#64748b", textAlign: "right" }}>{fmt(r.carVal)}</td>
                      <td style={{ padding: "10px", color: "#ef4444", textAlign: "right" }}>{fmt(r.loanBal)}</td>
                      <td style={{ padding: "10px", color: "#8b5cf6", textAlign: "right", fontWeight: 600 }}>{fmt(r.netBase)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── CASH FLOW TAB ── */}
        {tab === "Cash Flow" && (
          <div>
            <div style={{ background: "#0a0e18", border: "1px solid #1e2d40", borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: "#475569", letterSpacing: 2, marginBottom: 14 }}>MONTHLY INCOME VS CAR PAYMENT</div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={proj.slice(1)}>
                  <defs>
                    <linearGradient id="inc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="#0f1825" />
                  <XAxis dataKey="year" tick={{ fill: "#334155", fontSize: 11 }} tickFormatter={v => `Yr ${v}`} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#334155", fontSize: 10 }} tickFormatter={v => `$${v.toLocaleString()}`} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="monthlyIncome" name="Monthly Income" stroke="#10b981" strokeWidth={2} fill="url(#inc)" dot={{ fill: "#10b981", r: 3 }} />
                  <Line type="monotone" dataKey="carPayment" name="Car Payment" stroke="#ec4899" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                  <Area type="monotone" dataKey="surplus" name="Monthly Surplus" stroke="#8b5cf6" strokeWidth={1.5} fill="none" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[
                { label: "YR 1 MONTHLY INCOME", value: fmt(proj[1].monthlyIncome), color: "#10b981" },
                { label: "BOXSTER PAYMENT", value: fmt(Math.round(MONTHLY_CAR)), color: "#ec4899" },
                { label: "YR 1 MONTHLY SURPLUS", value: fmt(proj[1].surplus), color: "#8b5cf6" },
              ].map(c => (
                <div key={c.label} style={{ background: "#0a0e18", border: "1px solid #1e2d40", borderRadius: 12, padding: "14px 12px", textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "#334155", letterSpacing: 1, marginBottom: 6 }}>{c.label}</div>
                  <div style={{ fontSize: 20, fontFamily: "'Syne', sans-serif", fontWeight: 700, color: c.color }}>{c.value}</div>
                </div>
              ))}
            </div>

            <div style={{ background: "#0a0e18", border: "1px solid #1e2d40", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, color: "#475569", letterSpacing: 2, marginBottom: 12 }}>5-YEAR INCOME SUMMARY</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "Total portfolio income (5yr)", value: fmt(proj.slice(1).reduce((s,r)=>s+r.annualIncome,0)), color: "#10b981" },
                  { label: "Total car payments (5yr)", value: fmt(Math.round(MONTHLY_CAR * 60)), color: "#ec4899" },
                  { label: "Total surplus generated (5yr)", value: fmt(proj.slice(1).reduce((s,r)=>s+r.annualIncome,0) - Math.round(MONTHLY_CAR * 60)), color: "#8b5cf6" },
                  { label: "Boxster residual value (yr 5)", value: fmt(proj[5].carVal), color: "#64748b" },
                  { label: "Loan remaining (yr 5)", value: fmt(proj[5].loanBal), color: "#ef4444" },
                ].map(r => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #0f1825" }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>{r.label}</span>
                    <span style={{ fontSize: 13, color: r.color, fontWeight: 500 }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 14, fontSize: 10, color: "#334155", textAlign: "center", lineHeight: 1.6 }}>
              Projections are illustrative only · Not investment advice · Past returns ≠ future results<br/>
              Tax optimization can add $20–40k/yr in alpha at the 37% bracket · Consult a fee-only fiduciary CPA
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
