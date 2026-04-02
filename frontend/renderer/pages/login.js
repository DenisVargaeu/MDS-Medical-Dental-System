import * as api from '../assets/js/api.js';

export function renderLogin(container, onSuccess) {
  container.innerHTML = `
  <div class="login-page">
    <div class="login-bg-shape" style="width:600px;height:600px;top:-200px;left:-150px;"></div>
    <div class="login-bg-shape" style="width:300px;height:300px;bottom:-100px;left:200px;opacity:0.5;"></div>

    <div class="login-panel">
      <div class="login-brand">
        <div class="login-brand-icon"><i class="fas fa-tooth"></i></div>
        <div>
          <h1>MDS</h1>
          <p>Medical Dental System</p>
        </div>
      </div>

      <h2 class="login-title">Welcome back</h2>
      <p class="login-subtitle">Sign in to your account to continue</p>

      <form class="login-form" id="login-form" novalidate>
        <div class="form-group">
          <label class="form-label">Email address</label>
          <input type="email" id="login-email" class="form-control"
            placeholder="you@clinic.com" value="admin@mds.com" required autocomplete="email">
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input type="password" id="login-pass" class="form-control"
            placeholder="••••••••" value="Admin@123" required autocomplete="current-password">
        </div>

        <div id="login-error" class="alert alert-danger" style="display:none">
          <span class="alert-icon"><i class="fas fa-exclamation-circle"></i></span>
          <span id="login-error-msg"></span>
        </div>

        <button type="submit" class="btn btn-primary" id="login-btn" style="width:100%;margin-top:8px;padding:12px;font-size:14px">
          Sign In
        </button>
      </form>

      <p style="color:rgba(255,255,255,0.2);font-size:11px;margin-top:32px;text-align:center">
        MDS v1.1.0-beta — Secure dental clinic management
      </p>
    </div>

    <div class="login-visual">
      <div class="login-visual-card">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
          <div style="width:42px;height:42px;background:rgba(46,134,255,0.2);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;color:var(--primary-light)"><i class="fas fa-calendar-alt"></i></div>
          <div>
            <div style="color:#fff;font-weight:600;font-size:14px">Today's Schedule</div>
            <div style="color:rgba(255,255,255,0.4);font-size:12px">Your upcoming appointments</div>
          </div>
        </div>
        ${[
          { time:'09:00', name:'Maria Novak', type:'Consultation', status:'scheduled' },
          { time:'10:30', name:'Peter Kral', type:'Root Canal', status:'in_progress' },
          { time:'12:00', name:'Jana Horak', type:'Cleaning', status:'scheduled' },
          { time:'14:00', name:'Tomas Beno', type:'Crown Fitting', status:'scheduled' },
        ].map(a => `
          <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06)">
            <div style="font-size:12px;color:rgba(255,255,255,0.5);width:38px;flex-shrink:0">${a.time}</div>
            <div style="flex:1">
              <div style="font-size:13px;font-weight:500;color:rgba(255,255,255,0.85)">${a.name}</div>
              <div style="font-size:11px;color:rgba(255,255,255,0.35)">${a.type}</div>
            </div>
            <span style="font-size:10px;padding:3px 8px;border-radius:99px;background:rgba(46,134,255,0.2);color:#5FA3FF;font-weight:600">${a.status}</span>
          </div>`).join('')}
        <div style="margin-top:16px;text-align:center;font-size:12px;color:rgba(255,255,255,0.2)"><i class="fas fa-shield-alt"></i> Protected by end-to-end encryption</div>
      </div>
    </div>
  </div>`;

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value;
    const errEl = document.getElementById('login-error');
    const btn = document.getElementById('login-btn');

    errEl.style.display = 'none';
    btn.textContent = 'Signing in…';
    btn.disabled = true;

    try {
      const res = await api.auth.login(email, pass);
      onSuccess(res.user, res.token);
    } catch (err) {
      document.getElementById('login-error-msg').textContent = err.message;
      errEl.style.display = 'flex';
      btn.textContent = 'Sign In';
      btn.disabled = false;
    }
  });
}
