// Encrypted portfolio store + password gate, shared by all pages.
// No plaintext holdings are shipped: the data below is AES-GCM encrypted and
// only decryptable in the browser with the correct password. A user's local
// edits are kept in localStorage (plaintext, but local to their own browser).
(function () {
  window.STORAGE_KEY = 'stocktracker.positions.v2';
  const SESSION_KEY = 'stocktracker.unlocked.v2';
  const PW_KEY = 'stocktracker.pw.v2'; // password cached for this session (enables encrypted export)

  // AES-GCM encrypted holdings (password set by the owner; regenerate with the
  // local encrypt tool to change password/data). No plaintext is shipped.
  window.PORTFOLIO_ENC = {
    salt: "dw57/o1durOC/giqIA7xSg==",
    iv: "uP5Eb0aw57I8UYq1",
    ct: "9R8ziQYN5kkhJ19+ThDmCmn9PieK5aBD1Di/UIi+BtCKM+eF/R02zk8F0hWB7MAkDirtBTIAJnk7MGDHxdGVMq1jEdHXgM6G/a7wWIL2z4MTlrhjrjcvvRDyBy6mTvpuSJg+1s+uMwjCC5yui11Gbch7BT1cJ+hmVQmGclItkAiSr7IFXQwOK1kVe7osRfi/Qx5JsoPV86sLVy7S0+Bzy50+cvlvGd1OapWEqzJaATZ2Wz2NyRd3q1Lw2vG7X+YJKoyi6uhUD/jC7w5vkX0EmM14edKgb98D3os5bb8iGVZeAlSclcdRiEYBUKO0YWvEmdV75UTdtLXFjAZVsb4QQj6refbAb2mvA0f2Z97W/ASYYH9eBNo6F0rib+FhpOnF9adCNr80f9k5b/Q55Np8FMTx+nKDw2asKPdEGe235tTaGpoftt1vgrgiaWyz/jljmUUsY1meeIYimDPW+RmVdURbFz6AJZWhY2GPf14MFa2AGMUZ6UCMdW3q3OChmnmXDAEW5nt47ogsO0zgBMq2xvdm4LG00+JJbV1atd76UfblO/ha73wBRNGkMPtIBQjgtX7xP8rUtYY+9Cf6Q2zUs9YyGBzudc3cY4k/4Hf1UuV5sfn5a4KvM/A2DiBANxlhh/U5WEe08seW1m8DFrQQPcJpH8njlhoU4Tu1QLLZKE2DU5P27wEuM4lWucfSpjNkOyhAI/kA9ZKR6wlTccMBtM7c3lwdxqJLqn4Wc4uzbs1mrxsOQbTWdHeQavrF1TqgQm1YxyVJTiXCtc9Vu+KgB4hWqsP/xaRzQwquwFpm/HhEcQRXY2nkO7vWNk85/QP7hBnzw3+b+S6QM/peK5yHf3VaYzOBxKv06lfBTQIn5VlE91juqxl6OeiZjP8Btg3/h09E7RQp7YT0jkWuH/c5BMcJGeCCDhksJsVsY/oqsZLwFmqoBs+VEnXsUbgs3KjR2SGezyr8lIfTQ0IMfsYJrPz31oSbEp1rlaAhdNs8XVqW2dd4v33fFkqmW3CHwTrZUyZCQeR2vvO0ALzWg7OHwOGZAEoFrJ4WMg66oBrG4dEEwXoOibc9bswRHWGKaH9yM62apSYGf9yb82Hxr1UWF8FsARhVArfwQLvcF+TdPhTIPmzcZcuNZ/xfezZgQtaht2eHNPlXauyhoM+pADawj4MWmBZE8j7mOCzMH+ZYzyR8OPwtfw5UTxjUjenQ7fwiDQYCQriLy51lkNDpxRG2o4hoGnGy2bqLQyfzJf2hdsRcVZ37eywTB4d+qZlynhl/spQIirjf9essxLdZP5W8qzYk4ocTv5KWH4Rw+XwcRq8=",
  };

  const b64dec = str => Uint8Array.from(atob(str), c => c.charCodeAt(0));
  const b64enc = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));

  async function deriveKey(password, salt) {
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
    );
  }

  async function decryptDefaults(password) {
    const { salt, iv, ct } = window.PORTFOLIO_ENC;
    const key = await deriveKey(password, b64dec(salt));
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64dec(iv) }, key, b64dec(ct));
    return JSON.parse(new TextDecoder().decode(plain));
  }

  // Full-screen password overlay. Resolves with the decrypted defaults.
  function showGate() {
    return new Promise(resolve => {
      const ov = document.createElement('div');
      ov.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#04060d;display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,sans-serif;';
      ov.innerHTML =
        '<div style="background:#0f1825;border:1px solid #1e2d40;border-radius:14px;padding:28px;width:320px;text-align:center;color:#f8fafc;box-shadow:0 10px 40px rgba(0,0,0,.5)">' +
        '<div style="font-size:30px;margin-bottom:8px">🔒</div>' +
        '<div style="font-weight:700;margin-bottom:4px">Private Dashboard</div>' +
        '<div style="font-size:12px;color:#64748b;margin-bottom:16px">Enter password to view</div>' +
        '<input id="gate-pw" type="password" autocomplete="current-password" placeholder="Password" style="width:100%;padding:9px 12px;border-radius:8px;border:1px solid #334155;background:#04060d;color:#f8fafc;outline:none;margin-bottom:10px;font-size:14px"/>' +
        '<button id="gate-go" style="width:100%;padding:9px;border:none;border-radius:8px;background:#2563eb;color:#fff;font-weight:600;cursor:pointer;font-size:14px">Unlock</button>' +
        '<div id="gate-err" style="color:#ff6b6b;font-size:12px;margin-top:10px;min-height:16px"></div>' +
        '</div>';
      document.body.appendChild(ov);
      const pw = ov.querySelector('#gate-pw');
      const go = ov.querySelector('#gate-go');
      const err = ov.querySelector('#gate-err');
      pw.focus();
      async function attempt() {
        go.disabled = true; err.textContent = 'Decrypting…';
        try {
          const data = await decryptDefaults(pw.value);
          try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch (e) {}
          try { sessionStorage.setItem(PW_KEY, pw.value); } catch (e) {}
          ov.remove();
          resolve(data);
        } catch (e) {
          err.textContent = 'Incorrect password';
          go.disabled = false; pw.value = ''; pw.focus();
        }
      }
      go.onclick = attempt;
      pw.onkeydown = e => { if (e.key === 'Enter') attempt(); };
    });
  }

  // Ensure the session is unlocked (prompts once per tab). Returns decrypted defaults.
  window.unlockDashboard = async function () {
    try {
      const cached = sessionStorage.getItem(SESSION_KEY);
      if (cached) { const d = JSON.parse(cached); if (Array.isArray(d) && d.length) return d; }
    } catch (e) {}
    return showGate();
  };

  // Current portfolio: the user's saved edits if any (even an empty list, so
  // deleting every position sticks), else the decrypted defaults on first run.
  window.getPortfolio = async function () {
    const defaults = await window.unlockDashboard();
    try {
      const raw = localStorage.getItem(window.STORAGE_KEY);
      if (raw !== null) { const p = JSON.parse(raw); if (Array.isArray(p)) return p; }
    } catch (e) {}
    return defaults.map(x => ({ ...x }));
  };

  window.savePortfolio = function (positions) {
    try { localStorage.setItem(window.STORAGE_KEY, JSON.stringify(positions)); } catch (e) {}
  };

  // Password typed to unlock this session (for encrypted export). May be null.
  window.sessionPassword = function () {
    try { return sessionStorage.getItem(PW_KEY); } catch (e) { return null; }
  };

  // Encrypt an array -> { salt, iv, ct } (same scheme as the baked-in blob).
  window.encryptData = async function (dataArray, password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(dataArray)));
    return { salt: b64enc(salt), iv: b64enc(iv), ct: b64enc(ct) };
  };

  // Decrypt a { salt, iv, ct } blob with a password -> array (throws if wrong).
  window.decryptData = async function (blob, password) {
    const key = await deriveKey(password, b64dec(blob.salt));
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64dec(blob.iv) }, key, b64dec(blob.ct));
    const data = JSON.parse(new TextDecoder().decode(plain));
    if (!Array.isArray(data)) throw new Error('Not a portfolio file');
    return data;
  };

  // Unique tickers (first company name wins) — drives the vs Market page.
  window.uniqueHoldings = async function () {
    const seen = new Set();
    const out = [];
    (await window.getPortfolio()).forEach(p => {
      if (p && p.ticker && !seen.has(p.ticker)) { seen.add(p.ticker); out.push({ ticker: p.ticker, company: p.company || '' }); }
    });
    return out;
  };
})();
