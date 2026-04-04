import * as api from '../assets/js/api.js';

function fmt(val, prefix = '') {
  if (val == null || val === '') return '—';
  return prefix + Number(val).toLocaleString('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function statusBadge(status) {
  const map = {
    scheduled: ['badge-primary', '<i class="far fa-calendar-alt"></i> Scheduled'],
    confirmed: ['badge-info', '<i class="fas fa-check-circle"></i> Confirmed'],
    in_progress: ['badge-warning', '<i class="fas fa-hourglass-half"></i> In Progress'],
    completed: ['badge-success', '<i class="fas fa-check-double"></i> Completed'],
    cancelled: ['badge-muted', '<i class="fas fa-times-circle"></i> Cancelled'],
    no_show: ['badge-danger', '<i class="fas fa-exclamation-circle"></i> No Show'],
  };
  const [cls, label] = map[status] || ['badge-muted', status];
  return `<span class="badge ${cls}">${label}</span>`;
}

export async function renderDashboard(container) {
  try {
    const data = await api.dashboard.stats();
    const patients = data.patients || { total: 0, new_this_month: 0 };
    const appointments = data.appointments || { total: 0, completed: 0, upcoming: 0, missed: 0 };
    const revenue = data.revenue || { today: 0, this_month: 0 };
    const todayList = data.todayList || [];
    const recentPatients = data.recentPatients || [];
    const outstanding = data.outstanding || [];
    const monthlyRevChart = data.monthlyRevChart || [];

    const user = window.mdsCurrentUser() || { name: 'Doctor' };
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    container.innerHTML = `
    <div class="dashboard-welcome">
      <div class="welcome-text">
        <h1>${greeting}, Dr. ${user.name}</h1>
        <p>You have <strong>${appointments.upcoming}</strong> more appointments today. Here's what's happening in your clinic.</p>
      </div>
      <div class="welcome-date">
        <i class="far fa-calendar-alt"></i> ${new Date().toLocaleDateString('en-GB', { weekday:'long', month:'long', day:'numeric' })}
      </div>
    </div>

    <!-- Stat cards -->
    <div class="stat-grid">
      <div class="stat-card premium-blue">
        <div class="stat-main">
          <div class="stat-value">${patients.total}</div>
          <div class="stat-label">Total Patients</div>
        </div>
        <div class="stat-footer">
          <span class="trend up"><i class="fas fa-arrow-up"></i> ${patients.new_this_month}</span> new this month
        </div>
        <div class="stat-bg-icon"><i class="fas fa-user-injured"></i></div>
      </div>
      <div class="stat-card premium-green">
        <div class="stat-main">
          <div class="stat-value">${appointments.total}</div>
          <div class="stat-label">Appointments Today</div>
        </div>
        <div class="stat-footer">
          <span class="trend">${appointments.completed}</span> done · <span class="trend">${appointments.upcoming}</span> next
        </div>
        <div class="stat-bg-icon"><i class="fas fa-calendar-check"></i></div>
      </div>
      <div class="stat-card premium-orange">
        <div class="stat-main">
          <div class="stat-value">${fmt(revenue.today, '€')}</div>
          <div class="stat-label">Today's Revenue</div>
        </div>
        <div class="stat-footer">
          <span class="trend up"><i class="fas fa-chart-line"></i> ${fmt(revenue.this_month, '€')}</span> monthly
        </div>
        <div class="stat-bg-icon"><i class="fas fa-euro-sign"></i></div>
      </div>
      <div class="stat-card premium-purple">
        <div class="stat-main">
          <div class="stat-value">${fmt(outstanding.reduce((s,i)=>s+parseFloat(i.balance),0), '€')}</div>
          <div class="stat-label">Outstanding Balance</div>
        </div>
        <div class="stat-footer">
          <span class="trend down"><i class="fas fa-user-clock"></i> ${outstanding.length}</span> unpaid invoices
        </div>
        <div class="stat-bg-icon"><i class="fas fa-file-invoice-dollar"></i></div>
      </div>
    </div>

    <div class="dashboard-main-grid">
      <!-- Appointments List -->
      <div class="card bento-table">
        <div class="card-header">
          <div class="card-title">Schedule Overview</div>
          <button class="btn btn-ghost btn-sm" onclick="mdsNavigateTo('appointments')">Manage Calendar <i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="table-wrapper">
          ${todayList.length === 0 ? 
            '<div class="empty-state" style="padding:40px"><div class="empty-state-icon"><i class="fas fa-calendar-day"></i></div><h3>No appointments today</h3><p>Enjoy your free time or schedule a new one.</p></div>' : 
            `<table>
              <thead><tr><th>Time</th><th>Patient</th><th>Doctor</th><th>Type</th><th>Status</th></tr></thead>
              <tbody>
                ${todayList.map(a => `
                <tr onclick="mdsNavigateTo('appointments')">
                  <td class="time-cell">${a.time?.slice(0,5)}</td>
                  <td>
                    <div class="patient-cell">
                      <div class="avatar avatar-sm shadow">${a.first_name[0]}</div>
                      <div class="patient-info">
                        <div class="name">${a.first_name} ${a.last_name}</div>
                        <div class="sub">${a.type || 'Treatment'}</div>
                      </div>
                    </div>
                  </td>
                  <td class="doctor-cell">Dr. ${a.doctor_name}</td>
                  <td><div style="max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap">${a.type || '—'}</div></td>
                  <td>${statusBadge(a.status)}</td>
                </tr>`).join('')}
              </tbody>
            </table>`
          }
        </div>
      </div>

      <!-- Right Bento Column -->
      <div class="dashboard-side-grid">
        <!-- Modern Chart Card -->
        <div class="card premium-chart">
          <div class="card-header">
            <div class="card-title">Revenue Trends</div>
            <span class="trend up">+12.5%</span>
          </div>
          <div class="chart-container">
            ${monthlyRevChart.length === 0 ? '<p class="muted">No data available</p>' : `
              <svg viewBox="0 0 300 100" class="sparkline">
                <path d="M ${monthlyRevChart.map((r, i) => `${(i * 50) + 25} ${100 - (r.revenue / Math.max(...monthlyRevChart.map(x=>x.revenue)) * 80)}`).join(' L ')}" 
                      fill="none" stroke="var(--primary)" stroke-width="3" stroke-linecap="round" />
                ${monthlyRevChart.map((r, i) => `
                  <circle cx="${(i * 50) + 25}" cy="${100 - (r.revenue / Math.max(...monthlyRevChart.map(x=>x.revenue)) * 80)}" r="4" fill="var(--bg-card)" stroke="var(--primary)" stroke-width="2" />
                `).join('')}
              </svg>
              <div class="chart-labels">
                ${monthlyRevChart.map(r => `<span>${r.month.slice(5)}</span>`).join('')}
              </div>
            `}
          </div>
        </div>

        <!-- Recent Patients Bento -->
        <div class="card recent-patients-bento">
          <div class="card-header">
            <div class="card-title">New Registrations</div>
          </div>
          <div class="patient-list-compact">
            ${recentPatients.map(p => `
              <div class="patient-item-compact" onclick="mdsNavigateTo('patients')">
                <div class="avatar avatar-xs">${p.first_name[0]}${p.last_name[0]}</div>
                <div class="info">
                  <span class="name">${p.first_name} ${p.last_name}</span>
                  <span class="date">${new Date(p.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>

    <style>
      .dashboard-welcome { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; padding: 0 4px; }
      .welcome-text h1 { font-size: 28px; font-weight: 800; color: var(--text-primary); margin-bottom: 4px; letter-spacing: -0.5px; }
      .welcome-text p { color: var(--text-muted); font-size: 15px; }
      .welcome-date { background: var(--bg-card); padding: 8px 16px; border-radius: 12px; border: 1px solid var(--border); font-size: 13px; font-weight: 600; color: var(--text-secondary); box-shadow: var(--shadow-sm); display: flex; align-items: center; gap: 8px; }

      .stat-card { position: relative; overflow: hidden; padding: 24px; border-radius: 20px; transition: transform 0.3s, box-shadow 0.3s; cursor: default; }
      .stat-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-lg); }
      .stat-value { font-size: 32px; font-weight: 800; line-height: 1; margin-bottom: 6px; }
      .stat-label { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.7; }
      .stat-footer { margin-top: 16px; font-size: 12px; font-weight: 500; opacity: 0.9; }
      .trend { padding: 2px 8px; border-radius: 6px; font-weight: 700; margin-right: 4px; }
      .trend.up { background: rgba(52, 211, 153, 0.2); color: #059669; }
      .trend.down { background: rgba(248, 113, 113, 0.2); color: #dc2626; }
      .stat-bg-icon { position: absolute; right: -10px; bottom: -10px; font-size: 80px; opacity: 0.05; transform: rotate(-10deg); transition: 0.3s; }
      .stat-card:hover .stat-bg-icon { transform: rotate(0deg) scale(1.1); opacity: 0.1; }

      .premium-blue { background: linear-gradient(135deg, #eff6ff, #dbeafe); color: #1e40af; border: 1px solid #bfdbfe; }
      .premium-green { background: linear-gradient(135deg, #ecfdf5, #d1fae5); color: #065f46; border: 1px solid #a7f3d0; }
      .premium-orange { background: linear-gradient(135deg, #fff7ed, #ffedd5); color: #9a3412; border: 1px solid #fed7aa; }
      .premium-purple { background: linear-gradient(135deg, #faf5ff, #f3e8ff); color: #6b21a8; border: 1px solid #e9d5ff; }

      .dashboard-main-grid { display: grid; grid-template-columns: 1fr 320px; gap: 24px; }
      .dashboard-side-grid { display: flex; flex-direction: column; gap: 24px; }

      .bento-table { border-radius: 20px; }
      .time-cell { font-family: 'JetBrains Mono', monospace; font-weight: 700; color: var(--primary); }
      .patient-cell { display: flex; align-items: center; gap: 12px; }
      .patient-info .name { font-weight: 700; color: var(--text-primary); font-size: 14px; }
      .patient-info .sub { font-size: 11px; color: var(--text-muted); }

      .premium-chart { padding: 20px; border-radius: 20px; }
      .chart-container { margin-top: 16px; }
      .sparkline { width: 100%; height: 80px; filter: drop-shadow(0 4px 6px rgba(59, 130, 246, 0.2)); }
      .chart-labels { display: flex; justify-content: space-between; margin-top: 8px; font-size: 10px; color: var(--text-muted); font-weight: 600; }

      .recent-patients-bento { padding: 20px; border-radius: 20px; }
      .patient-list-compact { display: flex; flex-direction: column; gap: 12px; margin-top: 12px; }
      .patient-item-compact { display: flex; align-items: center; gap: 12px; padding: 8px; border-radius: 10px; cursor: pointer; transition: 0.2s; }
      .patient-item-compact:hover { background: var(--bg-app); }
      .patient-item-compact .info { display: flex; flex-direction: column; }
      .patient-item-compact .name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
      .patient-item-compact .date { font-size: 10px; color: var(--text-muted); }
    </style>
    `;
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><i class="fas fa-exclamation-triangle"></i></div><h3>Could not load dashboard</h3><p>${err.message}</p></div>`;
  }
}
