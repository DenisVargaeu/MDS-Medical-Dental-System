import * as api from '../assets/js/api.js';

export async function renderLogs(container) {
  try {
    const logs = await api.client('/logs');
    
    container.innerHTML = `
      <div class="page-header">
        <div class="page-title">
          <h2>System Audit Logs</h2>
          <p>Monitor system activity, security events, and record changes</p>
        </div>
      </div>

      <div class="card">
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Details</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              ${logs.length === 0 ? '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">No activity logs found</td></tr>' :
                logs.map(log => `
                <tr>
                  <td style="font-size:12px;color:var(--text-secondary)">${new Date(log.created_at).toLocaleString('sk-SK')}</td>
                  <td>
                    <div style="display:flex;align-items:center;gap:8px">
                      <div class="avatar avatar-sm">${(log.user_name?.[0] || '?')}${(log.user_surname?.[0] || '')}</div>
                      <span>${log.user_name} ${log.user_surname}</span>
                    </div>
                  </td>
                  <td><span class="badge ${getActionBadgeClass(log.action)}">${log.action}</span></td>
                  <td><span style="font-weight:600">${log.entity}</span> <small>#${log.entity_id || ''}</small></td>
                  <td style="max-width:300px;font-size:12px;color:var(--text-secondary)">
                    <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title='${JSON.stringify(log.details || {})}'>
                      ${formatDetails(log.details)}
                    </div>
                  </td>
                  <td style="font-family:monospace;font-size:11px">${log.ip_address || '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

  } catch (err) {
    container.innerHTML = `<div class="alert alert-error"><i class="fas fa-exclamation-circle"></i> ${err.message}</div>`;
  }
}

function getActionBadgeClass(action) {
  const a = action.toLowerCase();
  if (a.includes('delete') || a.includes('failed')) return 'badge-danger';
  if (a.includes('create') || a.includes('add')) return 'badge-success';
  if (a.includes('update') || a.includes('edit')) return 'badge-warning';
  if (a.includes('login')) return 'badge-primary';
  return 'badge-muted';
}

function formatDetails(details) {
  if (!details) return '—';
  try {
    const d = typeof details === 'string' ? JSON.parse(details) : details;
    return Object.entries(d).map(([k, v]) => `${k}:${v}`).join(', ');
  } catch (_) { return String(details); }
}
