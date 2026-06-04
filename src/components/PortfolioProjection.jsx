import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";

const CAR_COST = 90000;
const DOWN_PAYMENT = 18000;
const AUTO_LOAN = CAR_COST - DOWN_PAYMENT;
const AUTO_RATE = 0.06;
const AUTO_MONTHS = 60;
const MONTHLY_PAYMENT = (AUTO_LOAN * (AUTO_RATE / 12)) / (1 - Math.pow(1 + AUTO_RATE / 12, -AUTO_MONTHS));
const ANNUAL_CAR_EXPENSE = MONTHLY_PAYMENT * 12; // loan payment only

const SCENARIOS = [
  {
    id: "income",
    label: "Income Portfolio",
    color: "#3b82f6",
    description: "JEPI + SGOV + QYLD + REITs",
    initialInvest: 120000 - DOWN_PAYMENT,
    annualReturn: 0.071,
    annualReturnBear: 0.03,
    annualReturnBull: 0.10,
    monthlyIncome: true,
    incomeRate: 0.071,
  },
  {
    id: "blended",
    label: "Blended (QQQ + Income)",
    color: "#10b981",
    description: "60% QQQ + 40% Income ETFs",
    initialInvest: 120000 - DOWN_PAYMENT,
    annualReturn: 0.071 * 0.4 + 0.178 * 0.6,
    annualReturnBear: 0.03 * 0.4 + (-0.15) * 0.6,
    annualReturnBull: 0.10 * 0.4 + 0.30 * 0.6,
    monthlyIncome: true,
    incomeRate: 0.071 * 0.4,
  },
  {
    id: "qqq",
    label: "All QQQ",
    color: "#f59e0b",
    description: "100% QQQ, no income",
    initialInvest: 120000 - DOWN_PAYMENT,
    annualReturn: 0.178,
    annualReturnBear: -0.20,
    annualReturnBull: 0.35,
    monthlyIncome: false,
    incomeRate: 0.006,
  },
];

function project(scenario, years = 5) {
  const data = [];
  let base = scenario.initialInvest;
  let bear = scenario.initialInvest;
  let bull = scenario.initialInvest;

  data.push({ year: 0, base: Math.round(base), bear: Math.round(bear), bull: Math.round(bull) });

  for (let y = 1; y <= years; y++) {
    base = base * (1 + scenario.annualReturn);
    bear = bear * (1 + scenario.annualReturnBear);
    bull = bull * (1 + scenario.annualReturnBull);
    data.push({ year: y, base: Math.round(base), bear: Math.round(bear), bull: Math.round(bull) });
  }
  return data;
}

function projectNetWorth(scenario, years = 5) {
  const data = [];
  let portfolio = scenario.initialInvest;
  let portfolioBear = scenario.initialInvest;
  let portfolioBull = scenario.initialInvest;
  let carLoanBalance = AUTO_LOAN;

  for (let y = 0; y <= years; y++) {
    if (y > 0) {
      portfolio = portfolio * (1 + scenario.annualReturn);
      portfolioBear = portfolioBear * (1 + scenario.annualReturnBear);
      portfolioBull = portfolioBull * (1 + scenario.annualReturnBull);

      // reduce loan balance
      for (let m = 0; m < 12; m++) {
        const interest = carLoanBalance * (AUTO_RATE / 12);
        const principal = MONTHLY_PAYMENT - interest;
        carLoanBalance = Math.max(0, carLoanBalance - principal);
      }
    }

    // Car depreciates ~15% year 1, ~10% thereafter
    const carDepreciation = y === 0 ? 0 : y === 1 ? 0.15 : 0.10;
    const carValue = CAR_COST * Math.pow(0.88, y);

    const netBase = Math.round(portfolio + carValue - carLoanBalance);
    const netBear = Math.round(portfolioBear + carValue - carLoanBalance);
    const netBull = Math.round(portfolioBull + carValue - carLoanBalance);

    data.push({ year: y, base: netBase, bear: netBear, bull: netBull, carValue: Math.round(carValue), loanBalance: Math.round(carLoanBalance) });
  }
  return data;
}

const fmt = (n) => "$" + n.toLocaleString();

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm">
        <p className="text-gray-400 mb-1">Year {label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {fmt(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function PortfolioProjection() {
  const [activeScenario, setActiveScenario] = useState("blended");
  const [view, setView] = useState("portfolio"); // portfolio | networth | summary

  const scenario = SCENARIOS.find((s) => s.id === activeScenario);
  const portfolioData = project(scenario);
  const netWorthData = projectNetWorth(scenario);

  const annualIncome = Math.round(scenario.initialInvest * scenario.incomeRate);
  const monthlyIncome = Math.round(annualIncome / 12);

  const finalBase = portfolioData[5].base;
  const finalBear = portfolioData[5].bear;
  const finalBull = portfolioData[5].bull;

  const totalCarCost = Math.round(ANNUAL_CAR_EXPENSE * 5 + 12000 * 5); // loan + running costs
  const totalIncome5yr = annualIncome * 5;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 font-sans">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">5-Year Portfolio Projection</h1>
          <p className="text-gray-400 text-sm mt-1">$120,000 starting capital · {fmt(DOWN_PAYMENT)} down on Boxster GTS 4.0 · {fmt(Math.round(MONTHLY_PAYMENT))}/mo loan payment</p>
        </div>

        {/* Scenario Selector */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveScenario(s.id)}
              className={`rounded-xl p-3 text-left border transition-all ${
                activeScenario === s.id
                  ? "border-opacity-100 bg-opacity-20"
                  : "border-gray-800 bg-gray-900 hover:border-gray-600"
              }`}
              style={activeScenario === s.id ? { borderColor: s.color, backgroundColor: s.color + "22" } : {}}
            >
              <div className="text-xs font-semibold" style={{ color: activeScenario === s.id ? s.color : "#9ca3af" }}>
                {s.label}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{s.description}</div>
            </button>
          ))}
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 mb-4">
          {[
            { id: "portfolio", label: "Portfolio Value" },
            { id: "networth", label: "Net Worth" },
            { id: "summary", label: "Year-by-Year" },
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                view === v.id ? "bg-white text-gray-900" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Charts */}
        {view === "portfolio" && (
          <div className="bg-gray-900 rounded-2xl p-4 mb-4">
            <h2 className="text-sm font-semibold text-gray-300 mb-1">Portfolio Value Over 5 Years</h2>
            <p className="text-xs text-gray-500 mb-4">Base / Bear / Bull scenarios · {fmt(scenario.initialInvest)} invested</p>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={portfolioData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="year" tick={{ fill: "#6b7280", fontSize: 12 }} tickFormatter={(v) => `Yr ${v}`} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} tickFormatter={(v) => "$" + (v / 1000).toFixed(0) + "k"} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: "#9ca3af" }} />
                <Line type="monotone" dataKey="bull" name="Bull Case" stroke="#10b981" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                <Line type="monotone" dataKey="base" name="Base Case" stroke={scenario.color} strokeWidth={2.5} dot={{ fill: scenario.color, r: 4 }} />
                <Line type="monotone" dataKey="bear" name="Bear Case" stroke="#ef4444" strokeWidth={2} dot={false} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>

            {/* Key numbers */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { label: "Bear Case (Yr 5)", value: fmt(finalBear), color: "#ef4444" },
                { label: "Base Case (Yr 5)", value: fmt(finalBase), color: scenario.color },
                { label: "Bull Case (Yr 5)", value: fmt(finalBull), color: "#10b981" },
              ].map((item) => (
                <div key={item.label} className="bg-gray-800 rounded-xl p-3 text-center">
                  <div className="text-xs text-gray-500">{item.label}</div>
                  <div className="text-base font-bold mt-0.5" style={{ color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === "networth" && (
          <div className="bg-gray-900 rounded-2xl p-4 mb-4">
            <h2 className="text-sm font-semibold text-gray-300 mb-1">Net Worth (Portfolio + Car − Loan)</h2>
            <p className="text-xs text-gray-500 mb-4">Includes car depreciation and loan paydown</p>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={netWorthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="year" tick={{ fill: "#6b7280", fontSize: 12 }} tickFormatter={(v) => `Yr ${v}`} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} tickFormatter={(v) => "$" + (v / 1000).toFixed(0) + "k"} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: "#9ca3af" }} />
                <Line type="monotone" dataKey="bull" name="Bull Net Worth" stroke="#10b981" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                <Line type="monotone" dataKey="base" name="Base Net Worth" stroke={scenario.color} strokeWidth={2.5} dot={{ fill: scenario.color, r: 4 }} />
                <Line type="monotone" dataKey="bear" name="Bear Net Worth" stroke="#ef4444" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                <Line type="monotone" dataKey="carValue" name="Car Value" stroke="#6b7280" strokeWidth={1.5} dot={false} strokeDasharray="2 4" />
              </LineChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-gray-800 rounded-xl p-3">
                <div className="text-xs text-gray-500">Monthly Car Payment</div>
                <div className="text-base font-bold text-white mt-0.5">{fmt(Math.round(MONTHLY_PAYMENT))}/mo</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-3">
                <div className="text-xs text-gray-500">Monthly Portfolio Income</div>
                <div className="text-base font-bold mt-0.5" style={{ color: scenario.color }}>{fmt(monthlyIncome)}/mo</div>
              </div>
            </div>
          </div>
        )}

        {view === "summary" && (
          <div className="bg-gray-900 rounded-2xl p-4 mb-4">
            <h2 className="text-sm font-semibold text-gray-300 mb-3">Year-by-Year Breakdown (Base Case)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-800">
                    <th className="text-left py-2">Year</th>
                    <th className="text-right py-2">Portfolio</th>
                    <th className="text-right py-2">Income/yr</th>
                    <th className="text-right py-2">Car Value</th>
                    <th className="text-right py-2">Loan Bal.</th>
                    <th className="text-right py-2">Net Worth</th>
                  </tr>
                </thead>
                <tbody>
                  {netWorthData.map((row) => {
                    const pval = portfolioData[row.year].base;
                    const inc = Math.round(pval * scenario.incomeRate);
                    return (
                      <tr key={row.year} className="border-b border-gray-800 hover:bg-gray-800 transition-colors">
                        <td className="py-2 text-gray-400">{row.year === 0 ? "Start" : `Yr ${row.year}`}</td>
                        <td className="py-2 text-right font-medium" style={{ color: scenario.color }}>{fmt(pval)}</td>
                        <td className="py-2 text-right text-gray-300">{row.year === 0 ? "—" : fmt(inc)}</td>
                        <td className="py-2 text-right text-gray-400">{fmt(row.carValue)}</td>
                        <td className="py-2 text-right text-red-400">{fmt(row.loanBalance)}</td>
                        <td className="py-2 text-right font-semibold text-white">{fmt(row.base)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Assumptions */}
        <div className="bg-gray-900 rounded-2xl p-4 mb-4">
          <h2 className="text-sm font-semibold text-gray-400 mb-3">Scenario Assumptions</h2>
          <div className="grid grid-cols-3 gap-3">
            {SCENARIOS.map((s) => (
              <div key={s.id} className="text-xs">
                <div className="font-semibold mb-1" style={{ color: s.color }}>{s.label}</div>
                <div className="text-gray-500 space-y-0.5">
                  <div>Base: {(s.annualReturn * 100).toFixed(1)}%/yr</div>
                  <div>Bear: {(s.annualReturnBear * 100).toFixed(1)}%/yr</div>
                  <div>Bull: {(s.annualReturnBull * 100).toFixed(1)}%/yr</div>
                  <div>Income: {(s.incomeRate * 100).toFixed(1)}%/yr</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-gray-600 text-center">
          Projections are illustrative only and not investment advice. Past returns do not guarantee future results. 
          Car value assumes ~12% annual depreciation. Loan at 6% over 60 months.
        </p>
      </div>
    </div>
  );
}
