import { useState } from 'react'
import PortfolioProjection from './components/PortfolioProjection.jsx'
import MillionDollarDashboard from './components/MillionDollarDashboard.jsx'

const NAV = [
  { id: 'million', label: '$1M Dashboard', sub: 'Full allocation + 5yr projection' },
  { id: 'boxster', label: '$120k + Boxster', sub: '5yr projection with Porsche' },
  { id: 'stocks', label: '📈 Stock Tracker', sub: 'Live holdings, P&L, allocation' },
  { id: 'vsmarket', label: '📊 vs Market', sub: 'Weekly performance vs benchmark' },
]

export default function App() {
  const [active, setActive] = useState('million')

  return (
    <div style={{ minHeight: '100vh', background: '#080b12', fontFamily: "'DM Mono', 'Courier New', monospace" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');`}</style>

      {/* Top nav */}
      <nav style={{
        borderBottom: '1px solid #1e2d40',
        background: '#04060d',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        flexWrap: 'wrap',
      }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 15, color: '#f8fafc', letterSpacing: -0.5 }}>
          💼 FINANCE DASHBOARD
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setActive(n.id)} style={{
              background: active === n.id ? '#1e2d40' : 'transparent',
              border: `1px solid ${active === n.id ? '#334155' : '#0f1825'}`,
              borderRadius: 8,
              padding: '6px 14px',
              cursor: 'pointer',
              color: active === n.id ? '#f8fafc' : '#475569',
              fontSize: 11,
              fontFamily: "'DM Mono', monospace",
              transition: 'all 0.15s',
            }}>
              {n.label}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 10, color: '#1e2d40' }}>
          NOT FINANCIAL ADVICE · ILLUSTRATIVE ONLY
        </div>
      </nav>

      {/* Dashboard content */}
      {active === 'million' && <MillionDollarDashboard />}
      {active === 'boxster' && <PortfolioProjection />}
      {active === 'stocks' && (
        <iframe
          title="Stock Investment Tracker"
          src={`${import.meta.env.BASE_URL}stock-tracker.html`}
          style={{ width: '100%', height: 'calc(100vh - 53px)', border: 'none', display: 'block', background: '#f5f5f7' }}
        />
      )}
      {active === 'vsmarket' && (
        <iframe
          title="Stocks vs Market — Weekly"
          src={`${import.meta.env.BASE_URL}vs-market.html`}
          style={{ width: '100%', height: 'calc(100vh - 53px)', border: 'none', display: 'block', background: '#f5f5f7' }}
        />
      )}
    </div>
  )
}
