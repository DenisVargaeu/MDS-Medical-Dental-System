import * as api from '../assets/js/api.js';

export async function renderSystem(container) {
  const user = window.mdsCurrentUser();
  
  // Mock some system stats for visual flair
  const stats = {
    uptime: '14 days, 6 hours',
    dbSize: '24.5 MB',
    lastBackup: 'Today, 04:00 AM',
    apiLatency: '42ms'
  };

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <h2>System Information</h2>
        <p>Technical overview and application status</p>
      </div>
      <div class="badge badge-success">System Online</div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
      <!-- App Info Card -->
      <div class="card">
        <div class="card-header"><div class="card-title"><i class="fas fa-info-circle"></i> Application Status</div></div>
        <div class="card-body">
          <div style="text-align:center;padding:20px 0">
            <div style="font-size:48px;color:var(--primary);margin-bottom:12px"><i class="fas fa-tooth"></i></div>
            <h3 style="font-size:24px;font-weight:700;margin:0">MDS Core</h3>
            <p style="color:var(--text-muted)">Medical Dental System</p>
            <div style="margin-top:16px">
              <span class="badge badge-primary">Version 1.0.0-beta.1</span>
              <span class="badge badge-secondary">Build 2024.04.02</span>
            </div>
          </div>
          <hr style="border:0;border-top:1px solid var(--border);margin:20px 0">
          <table style="width:100%">
            <tbody>
              <tr><td style="padding:8px 0;color:var(--text-muted)">Environment</td><td style="text-align:right;font-weight:600">Production (Staging)</td></tr>
              <tr><td style="padding:8px 0;color:var(--text-muted)">License</td><td style="text-align:right;font-weight:600">Professional Edition</td></tr>
              <tr><td style="padding:8px 0;color:var(--text-muted)">Client Engine</td><td style="text-align:right;font-weight:600">Electron / V8</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Infrastructure Card -->
      <div class="card">
        <div class="card-header"><div class="card-title"><i class="fas fa-server"></i> Infrastructure</div></div>
        <div class="card-body">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
            <div style="padding:16px;background:var(--bg-app);border-radius:12px;text-align:center">
              <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">DB Uptime</div>
              <div style="font-size:18px;font-weight:700">${stats.uptime}</div>
            </div>
            <div style="padding:16px;background:var(--bg-app);border-radius:12px;text-align:center">
              <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">DB Size</div>
              <div style="font-size:18px;font-weight:700">${stats.dbSize}</div>
            </div>
            <div style="padding:16px;background:var(--bg-app);border-radius:12px;text-align:center">
              <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">API Latency</div>
              <div style="font-size:18px;font-weight:700;color:var(--success)">${stats.apiLatency}</div>
            </div>
            <div style="padding:16px;background:var(--bg-app);border-radius:12px;text-align:center">
              <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">Last Backup</div>
              <div style="font-size:18px;font-weight:700;color:var(--info)">${stats.lastBackup}</div>
            </div>
          </div>
          <div style="margin-top:24px">
            <h4 style="font-size:13px;font-weight:700;margin-bottom:12px">Database Connection</h4>
            <div style="padding:12px;background:var(--bg-dark);border-radius:8px;font-family:monospace;font-size:12px;color:#a9b7c6;border:1px solid #323232">
              <span style="color:#cc7832">HOST:</span> sql20.dnsserver.eu<br>
              <span style="color:#cc7832">USER:</span> db215343xdenis<br>
              <span style="color:#cc7832">NAME:</span> db215343xdenis
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Credits / Footer -->
    <div style="margin-top:40px;text-align:center;color:var(--text-muted);font-size:13px;padding-bottom:40px">
      <p>&copy; 2024 MDS Medical Dental System. All rights reserved.</p>
      <p style="margin-top:8px">Developed with <i class="fas fa-heart" style="color:var(--danger)"></i> for professional clinics.</p>
    </div>
  `;
}
