import * as api from '../assets/js/api.js';

/**
 * Renders the pairing screen
 */
export async function renderPairing(container, onSuccess) {
  container.innerHTML = `
    <div class="login-container">
      <div class="login-box pairing-box">
        <div class="login-header">
          <div class="login-logo"><i class="fas fa-link"></i></div>
          <h1>System Pairing</h1>
          <p>Please enter the server address and pairing code shown on the backend console.</p>
        </div>

        <form id="pairing-form" class="login-form">
          <div class="form-group">
            <label for="pairing-host">Server IP or Hostname</label>
            <div class="input-with-icon">
              <i class="fas fa-server"></i>
              <input type="text" id="pairing-host" placeholder="e.g. 192.168.1.5 or mds-server" required>
            </div>
            <small>Example: http://192.168.1.5:3000</small>
          </div>

          <div class="form-group">
            <label for="pairing-code">Pairing Code</label>
            <div class="input-with-icon">
              <i class="fas fa-key"></i>
              <input type="text" id="pairing-code" placeholder="6-digit code" maxlength="6" required>
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-block" id="pairing-submit">
            <i class="fas fa-plug"></i> Pair Device
          </button>
        </form>

        <div class="login-footer">
          <p><i class="fas fa-info-circle"></i> The pairing code is valid for 7 days.</p>
        </div>
      </div>
    </div>
  `;

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
