import * as api from '../assets/js/api.js';

/**
 * Renders the pairing screen
 */
export async function renderPairing(container, onSuccess) {
  container.innerHTML = `
  <div class="login-page">
    <div class="login-bg-shape" style="width:600px;height:600px;top:-200px;left:-150px;"></div>
    <div class="login-bg-shape" style="width:300px;height:300px;bottom:-100px;left:200px;opacity:0.5;"></div>

    <div class="login-panel">
      <div class="login-brand">
        <div class="pairing-icon" style="width:52px;height:52px;border-radius:14px;font-size:26px;box-shadow:0 8px 24px rgba(46,134,255,0.4)"><i class="fas fa-link"></i></div>
        <div>
          <h1>MDS</h1>
          <p>System Pairing</p>
        </div>
      </div>

      <h2 class="login-title">Connect Device</h2>
      <p class="login-subtitle">Link your device to the MDS server to begin</p>

      <form class="login-form" id="pairing-form" novalidate>
        <div class="form-group">
          <label class="form-label">Server Address</label>
          <input type="text" id="pairing-host" class="form-control"
            placeholder="e.g. 192.168.1.5 or mds-server" required tabindex="1">
          <div class="input-hint" style="color:rgba(255,255,255,0.3);font-size:10px;margin-top:4px">Example: 192.168.1.5 (Port 3000 default)</div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Pairing PIN</label>
          <input type="text" id="pairing-code" class="form-control"
            placeholder="6-digit PIN" maxlength="6" required tabindex="2" 
            style="letter-spacing: 0.5em; text-align: center; font-weight: 700; font-size: 1.4rem;">
          <div class="input-hint" style="color:rgba(255,255,255,0.3);font-size:10px;margin-top:4px">Check the backend console for the PIN</div>
        </div>

        <button type="submit" class="btn btn-primary" id="pairing-submit" style="width:100%;margin-top:24px;padding:14px;font-size:14px">
          <i class="fas fa-plug"></i> Pair Device
        </button>
      </form>

      <p style="color:rgba(255,255,255,0.2);font-size:11px;margin-top:32px;text-align:center">
        <i class="fas fa-shield-alt"></i> Secure Peer-to-Peer Connection<br>
        PIN expires every 7 days
      </p>
    </div>

    <div class="login-visual">
      <div class="login-visual-card">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
          <div style="width:48px;height:48px;background:rgba(46,134,255,0.2);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:24px;color:var(--primary-light)"><i class="fas fa-network-wired"></i></div>
          <div>
            <div style="color:#fff;font-weight:600;font-size:15px">Connection Guide</div>
            <div style="color:rgba(255,255,255,0.4);font-size:12px">How to link your system</div>
          </div>
        </div>
        
        <div style="display:flex;flex-direction:column;gap:16px">
          <div style="display:flex;gap:12px">
            <div style="width:24px;height:24px;background:rgba(255,255,255,0.1);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;color:#fff;font-weight:700;flex-shrink:0">1</div>
            <p style="font-size:13px;color:rgba(255,255,255,0.7);line-height:1.4">Open the <b>MDS Backend</b> terminal on your server machine.</p>
          </div>
          <div style="display:flex;gap:12px">
            <div style="width:24px;height:24px;background:rgba(255,255,255,0.1);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;color:#fff;font-weight:700;flex-shrink:0">2</div>
            <p style="font-size:13px;color:rgba(255,255,255,0.7);line-height:1.4">Find the <b>IP ADDR</b> and <b>PAIRING PIN</b> displayed in the console.</p>
          </div>
          <div style="display:flex;gap:12px">
            <div style="width:24px;height:24px;background:rgba(255,255,255,0.1);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;color:#fff;font-weight:700;flex-shrink:0">3</div>
            <p style="font-size:13px;color:rgba(255,255,255,0.7);line-height:1.4">Enter these details on the left to securely link this device.</p>
          </div>
        </div>

        <div style="margin-top:32px;padding:16px;background:rgba(255,255,255,0.03);border-radius:12px;border:1px solid rgba(255,255,255,0.05)">
          <div style="display:flex;align-items:center;gap:8px;color:var(--warning);font-size:12px;font-weight:600;margin-bottom:6px">
            <i class="fas fa-exclamation-triangle"></i> Security Note
          </div>
          <p style="font-size:11px;color:rgba(255,255,255,0.4);line-height:1.5">
            The pairing PIN is temporary and expires periodically. If the connection fails, check the backend console for a new PIN.
          </p>
        </div>
      </div>
    </div>
  </div>`;

  const form = document.getElementById('pairing-form');
  const hostInput = document.getElementById('pairing-host');
  const codeInput = document.getElementById('pairing-code');
  const submitBtn = document.getElementById('pairing-submit');

  // Pre-fill existing host if any
  const currentHost = api.getServerUrl();
  hostInput.value = currentHost.replace(/^http:\/\//, '').replace(/:3000$/, '');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    let host = hostInput.value.trim();
    const code = codeInput.value.trim();

    if (!host.startsWith('http')) {
      host = `http://${host}`;
    }
    // Add default port if missing and not localhost
    if (!host.includes(':') && host !== 'http://localhost') {
      host = `${host}:3000`;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Pairing...';

    try {
      // Temporarily set server URL to verify
      const originalUrl = api.getServerUrl();
      api.setServerUrl(host);

      // Call verify-pairing endpoint
      const res = await api.client('/auth/verify-pairing', {
        method: 'POST',
        body: { code }
      });

      if (res.success) {
        window.mdsToast('Device paired successfully!', 'success');
        localStorage.setItem('mds_is_paired', 'true');
        localStorage.setItem('mds_pairing_code', code);
        onSuccess();
      } else {
        throw new Error('Invalid pairing code');
      }
    } catch (err) {
      window.mdsToast(err.message, 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-plug"></i> Pair Device';
    }
  });
}
