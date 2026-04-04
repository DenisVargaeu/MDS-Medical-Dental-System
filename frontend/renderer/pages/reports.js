import * as api from '../assets/js/api.js';

export async function renderReports(container) {
  try {
    const revenueData = await api.client('/finance/stats') || {};
    const patientsRes = await api.client('/patients?limit=1000') || {};
    
    // Support both wrapped {data:[]} and direct [] responses
    const pData = Array.isArray(patientsRes) ? patientsRes : (patientsRes.data || []);

    const stats = {
      totalRevenue: revenueData.totalRevenue || 0,
      monthlyRevenue: revenueData.monthlyRevenue || 0,
      patientCount: pData.length,
      avgAge: Math.round(pData.reduce((acc, p) => acc + (p.age || 0), 0) / (pData.length || 1))
    };

    container.innerHTML = `
      <div class="page-header bento-header">
        <div class="page-title">
          <h2>Analytics & Reports</h2>
          <p>Clinic Performance Overview — Last 30 Days</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-ghost" onclick="window.print()"><i class="fas fa-print"></i></button>
          <button class="btn btn-primary shadow-sm"><i class="fas fa-file-export"></i> Export CSV</button>
        </div>
      </div>

      <div class="stat-grid">
        <div class="stat-card premium-orange">
          <div class="stat-main">
            <div class="stat-value">€${stats.totalRevenue.toLocaleString()}</div>
            <div class="stat-label">Total Revenue</div>
          </div>
          <div class="stat-footer"><span class="trend up">+8.2%</span> from last year</div>
          <div class="stat-bg-icon"><i class="fas fa-chart-line"></i></div>
        </div>
        <div class="stat-card premium-blue">
          <div class="stat-main">
            <div class="stat-value">${stats.patientCount}</div>
            <div class="stat-label">Active Patients</div>
          </div>
          <div class="stat-footer"><span class="trend up">+12</span> new this month</div>
          <div class="stat-bg-icon"><i class="fas fa-users-medical"></i></div>
        </div>
        <div class="stat-card premium-purple">
          <div class="stat-main">
            <div class="stat-value">${stats.avgAge}y</div>
            <div class="stat-label">Average Patient Age</div>
          </div>
          <div class="stat-footer"><span class="trend">Stable</span> demographics</div>
          <div class="stat-bg-icon"><i class="fas fa-user-clock"></i></div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px">
        <div class="card premium-viz">
          <div class="card-header"><div class="card-title">Treatment Revenue Mix</div></div>
          <div class="card-body" style="height:280px;display:flex;align-items:center;justify-content:center">
            <svg viewBox="0 0 100 100" style="width:180px;height:180px;transform:rotate(-90deg)">
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#1e40af" stroke-width="20" stroke-dasharray="251.3" stroke-dashoffset="60" />
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#065f46" stroke-width="20" stroke-dasharray="251.3" stroke-dashoffset="180" />
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#9a3412" stroke-width="20" stroke-dasharray="251.3" stroke-dashoffset="230" />
            </svg>
            <div class="viz-legend" style="margin-left:20px; display:flex; flex-direction:column; gap:8px">
              <div class="flex-center" style="gap:8px"><span style="width:12px; height:12px; border-radius:3px; background:#1e40af"></span> Restorative (45%)</div>
              <div class="flex-center" style="gap:8px"><span style="width:12px; height:12px; border-radius:3px; background:#065f46"></span> Cosmetic (30%)</div>
              <div class="flex-center" style="gap:8px"><span style="width:12px; height:12px; border-radius:3px; background:#9a3412"></span> Preventive (25%)</div>
            </div>
          </div>
        </div>

        <div class="card premium-viz">
          <div class="card-header"><div class="card-title">Patient Demographics</div></div>
          <div class="card-body" style="padding:24px">
            <div style="display:flex;flex-direction:column;gap:20px">
              ${renderDemoBar('Male', pData.filter(p=>p.gender==='male').length, pData.length, '#1e40af')}
              ${renderDemoBar('Female', pData.filter(p=>p.gender==='female').length, pData.length, '#ec4899')}
              ${renderDemoBar('Other', pData.filter(p=>p.gender==='other').length, pData.length, '#94a3b8')}
            </div>
          </div>
        </div>
      </div>

      <div class="card shadow-sm bento-table">
        <div class="card-header">
          <div class="card-title">Performance by Treatment</div>
          <button class="btn btn-ghost btn-sm">Full Analysis <i class="fas fa-external-link-alt"></i></button>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr><th>Treatment Name</th><th>Qty.</th><th>Revenue</th><th>Trend</th></tr>
            </thead>
            <tbody>
              <tr><td>Composite Filling (Multisurface)</td><td>42</td><td><strong>€3,360</strong></td><td style="color:var(--success)"><i class="fas fa-arrow-up"></i> 12%</td></tr>
              <tr><td>Professional Cleaning</td><td>38</td><td><strong>€2,280</strong></td><td style="color:var(--success)"><i class="fas fa-arrow-up"></i> 5%</td></tr>
              <tr><td>Surgical Tooth Extraction</td><td>12</td><td><strong>€960</strong></td><td style="color:var(--danger)"><i class="fas fa-arrow-down"></i> 2%</td></tr>
              <tr><td>Comprehensive Examination</td><td>55</td><td><strong>€1,100</strong></td><td style="color:var(--success)"><i class="fas fa-arrow-up"></i> 8%</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <style>
        .flex-center { display: flex; align-items: center; font-size: 13px; font-weight: 600; color: var(--text-secondary); }
        .premium-viz { border-radius: 20px; }
        .bento-header { margin-bottom: 32px; }
        .header-actions { display: flex; gap: 12px; }
      </style>
    `;
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error"><i class="fas fa-exclamation-circle"></i> ${err.message}</div>`;
  }
}

function renderDemoBar(label, count, total, color) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
  return `
    <div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px;font-weight:700">
        <span style="color:var(--text-primary)">${label} (${count})</span>
        <span style="color:${color}">${percent}%</span>
      </div>
      <div style="height:12px;background:var(--bg-app);border-radius:6px;overflow:hidden;box-shadow:inset 0 1px 2px rgba(0,0,0,0.1)">
        <div style="height:100%;width:${percent}%;background:${color};transition:width 1s cubic-bezier(0.4, 0, 0.2, 1)"></div>
      </div>
    </div>
  `;
}
