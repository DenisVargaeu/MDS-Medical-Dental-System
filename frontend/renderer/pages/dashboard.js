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
    const { patients, appointments, revenue, todayList, recentPatients, outstanding, monthlyRevChart } = data;

    container.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <h2>Dashboard</h2>
        <p>Overview of clinic activity — ${new Date().toLocaleDateString('en-GB', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
      </div>
    </div>

    <!-- Stat cards -->
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-icon blue"><i class="fas fa-user-injured"></i></div>
        <div class="stat-info">
          <div class="stat-value">${patients.total}</div>
          <div class="stat-label">Total Patients</div>
          <div class="stat-change up">+${patients.new_this_month} this month</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green"><i class="fas fa-calendar-alt"></i></div>
        <div class="stat-info">
          <div class="stat-value">${appointments.total}</div>
          <div class="stat-label">Today's Appointments</div>
          <div class="stat-change">${appointments.completed} completed · ${appointments.upcoming} upcoming</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange"><i class="fas fa-euro-sign"></i></div>
        <div class="stat-info">
          <div class="stat-value">${fmt(revenue.today, '€')}</div>
          <div class="stat-label">Today's Revenue</div>
          <div class="stat-change up">${fmt(revenue.this_month, '€')} this month</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon red"><i class="fas fa-user-clock"></i></div>
        <div class="stat-info">
          <div class="stat-value">${appointments.missed || 0}</div>
          <div class="stat-label">Missed Appointments</div>
          <div class="stat-change down">Today's no-shows</div>
        </div>
      </div>
    </div>

    <!-- Main grid -->
    <div style="display:grid;grid-template-columns:1fr 380px;gap:20px">
      <!-- Today's Appointments -->
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i class="fas fa-calendar-day"></i> Today's Appointments</div>
          <button class="btn btn-sm btn-primary" onclick="mdsNavigateTo('appointments')">View All</button>
        </div>
        <div class="table-wrapper">
          ${todayList.length === 0 ? `<div class="empty-state" style="padding:40px"><div class="empty-state-icon"><i class="fas fa-calendar-day"></i></div><h3>No appointments today</h3></div>` : `
          <table>
            <thead><tr><th>Time</th><th>Patient</th><th>Doctor</th><th>Type</th><th>Status</th><th>Alerts</th></tr></thead>
            <tbody>
              ${todayList.map(a => `
              <tr style="cursor:pointer" onclick="mdsNavigateTo('appointments')">
                <td><strong>${a.time?.slice(0,5)}</strong></td>
                <td>
                  <div class="flex" style="display:flex;align-items:center;gap:8px">
                    <div class="avatar avatar-sm">${a.first_name[0]}${a.last_name[0]}</div>
                    <div>
                      <div style="font-weight:600">${a.first_name} ${a.last_name}</div>
                      <div style="font-size:11px;color:var(--text-muted)">${a.patient_phone || ''}</div>
                    </div>
                  </div>
                </td>
                <td>Dr. ${a.doctor_name}</td>
                <td>${a.type || '—'}</td>
                <td>${statusBadge(a.status)}</td>
                <td>${a.warning_flags ? `<span class="badge badge-danger"><i class="fas fa-exclamation-triangle"></i> ${a.warning_flags.slice(0,20)}</span>` : '<span class="badge badge-success"><i class="fas fa-check"></i> Clear</span>'}</td>
              </tr>`).join('')}
            </tbody>
          </table>`}
        </div>
      </div>

      <!-- Right Column -->
      <div style="display:flex;flex-direction:column;gap:20px">
        <!-- Revenue Chart (last 6 months) -->
        <div class="card">
          <div class="card-header">
            <div class="card-title"><i class="fas fa-chart-line"></i> Monthly Revenue</div>
          </div>
          <div class="card-body">
            ${monthlyRevChart.length === 0 ? '<p style="color:var(--text-muted);font-size:13px">No data yet</p>' :
            (() => {
              const max = Math.max(...monthlyRevChart.map(r => r.revenue)) || 1;
              return `<div style="display:flex;align-items:flex-end;gap:8px;height:100px">
                ${monthlyRevChart.map(r => `
                  <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
                    <div style="width:100%;background:var(--primary);border-radius:4px 4px 0 0;height:${Math.max(4, (r.revenue/max)*90)}px;transition:.3s" title="${fmt(r.revenue,'€')}"></div>
                    <div style="font-size:10px;color:var(--text-muted);white-space:nowrap">${r.month.slice(5)}</div>
                  </div>`).join('')}
              </div>`;
            })()}
          </div>
        </div>

        <!-- Outstanding invoices -->
        <div class="card">
          <div class="card-header">
            <div class="card-title"><i class="fas fa-file-invoice"></i> Outstanding</div>
            <button class="btn btn-sm btn-ghost" onclick="mdsNavigateTo('finance')">View</button>
          </div>
          <div style="padding:0 4px">
            ${outstanding.length === 0 ? '<div class="empty-state" style="padding:24px"><div class="empty-state-icon"><i class="fas fa-check-double"></i></div><h3>All paid up</h3></div>' :
            outstanding.map(inv => `
              <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid var(--border)">
                <div style="flex:1;min-width:0">
                  <div style="font-weight:600;font-size:13px">${inv.first_name} ${inv.last_name}</div>
                  <div style="font-size:11px;color:var(--text-muted)">${inv.invoice_number}</div>
                </div>
                <div style="text-align:right">
                  <div style="font-weight:700;color:var(--danger)">${fmt(inv.balance, '€')}</div>
                  <div style="font-size:10px;color:var(--text-muted)">${inv.due_date || ''}</div>
                </div>
              </div>`).join('')}
          </div>
        </div>

        <!-- Recent patients -->
        <div class="card">
          <div class="card-header">
            <div class="card-title"><i class="fas fa-users-medical"></i> New Patients</div>
          </div>
          <div style="padding:4px">
            ${recentPatients.map(p => `
              <div class="nav-item" style="padding:10px 12px;color:var(--text-primary)" onclick="mdsNavigateTo('patients')">
                <div class="avatar avatar-sm">${p.first_name[0]}${p.last_name[0]}</div>
                <div style="flex:1;min-width:0">
                  <div style="font-size:13px;font-weight:500">${p.first_name} ${p.last_name}</div>
                  <div style="font-size:11px;color:var(--text-muted)">${p.phone || ''}</div>
                </div>
              </div>`).join('')}
          </div>
        </div>
      </div>
    </div>`;
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><i class="fas fa-exclamation-triangle"></i></div><h3>Could not load dashboard</h3><p>${err.message}</p></div>`;
  }
}
