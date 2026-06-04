import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Load the shared encrypted-portfolio gate, then require the password before
// rendering anything. The iframe pages share the same unlocked session.
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
  })
}

async function start() {
  try {
    await loadScript(import.meta.env.BASE_URL + 'portfolio.js')
    if (window.unlockDashboard) await window.unlockDashboard()
  } catch (e) {
    // If the gate fails to load, fall through and render (pages still gate data).
    console.error('Gate load failed:', e)
  }
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

start()
