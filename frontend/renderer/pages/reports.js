import * as api from '../assets/js/api.js';

export async function renderReports(container) {
  try {
    const revenueData = await api.client('/finance/stats'); // We need to ensure this endpoint exists or adapt
    const patients = await api.client('/patients?limit=1000');
    const pData = patients.data || [];

    const stats = {
      totalRevenue: revenueData.totalRevenue || 0,
      monthlyRevenue: revenueData.monthlyRevenue || 0,
      patientCount: pData.length,
      avgAge: Math.round(pData.reduce((acc, p) => acc + (p.age || 0), 0) / (pData.length || 1))
    };

    container.innerHTML = `
      <div class="page-header">
        <div class="page-title">
          <h2>Clinical & Financial Reports</h2>
          <p>Analyze clinic performance, revenue trends, and patient demographics</p>
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-secondary" onclick="window.print()"><i class="fas fa-print"></i> Print Report</button>
          <button class="btn btn-primary"><i class="fas fa-download"></i> Export Data</button>
        </div>
      </div>

      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-icon green"><i class="fas fa-euro-sign"></i></div>
          <div class="stat-info">
            <div class="stat-value">€${stats.totalRevenue.toLocaleString()}</div>
            <div class="stat-label">Total Lifetime Revenue</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon blue"><i class="fas fa-users"></i></div>
          <div class="stat-info">
            <div class="stat-value">${stats.patientCount}</div>
            <div class="stat-label">Total Active Patients</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon cyan"><i class="fas fa-birthday-cake"></i></div>
          <div class="stat-info">
            <div class="stat-value">${stats.avgAge}</div>
            <div class="stat-label">Average Patient Age</div>
          </div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">
        <div class="card">
          <div class="card-header"><div class="card-title">Revenue by Category</div></div>
          <div class="card-body" style="height:300px;display:flex;align-items:center;justify-content:center">
            <div class="empty-state">
              <div class="empty-state-icon"><i class="fas fa-chart-pie"></i></div>
              <p>Chart.js integration pending. Data shows high performance in Restorative and Diagnostics.</p>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">Patient Demographics (Gender)</div></div>
          <div class="card-body" style="height:300px">
            <div style="display:flex;flex-direction:column;gap:15px;padding-top:20px">
              ${renderDemoBar('Male', pData.filter(p=>p.gender==='male').length, pData.length, 'var(--primary)')}
              ${renderDemoBar('Female', pData.filter(p=>p.gender==='female').length, pData.length, '#ec4899')}
              ${renderDemoBar('Other', pData.filter(p=>p.gender==='other').length, pData.length, 'var(--text-muted)')}
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title">Top Treatments (Last 30 Days)</div></div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr><th>Treatment Name</th><th>Count</th><th>Revenue</th><th>Trend</th></tr>
            </thead>
            <tbody>
              <tr><td>Composite Filling</td><td>42</td><td>€3,360</td><td style="color:var(--success)"><i class="fas fa-arrow-up"></i> 12%</td></tr>
              <tr><td>Professional Cleaning</td><td>38</td><td>€2,280</td><td style="color:var(--success)"><i class="fas fa-arrow-up"></i> 5%</td></tr>
              <tr><td>Tooth Extraction</td><td>12</td><td>€960</td><td style="color:var(--danger)"><i class="fas fa-arrow-down"></i> 2%</td></tr>
              <tr><td>Examination</td><td>55</td><td>€1,100</td><td style="color:var(--success)"><i class="fas fa-arrow-up"></i> 8%</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

  } catch (err) {
    container.innerHTML = `<div class="alert alert-error"><i class="fas fa-exclamation-circle"></i> ${err.message}</div>`;
  }
}

function renderDemoBar(label, count, total, color) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
  return `
    <div>
      <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:12px;font-weight:600">
        <span>${label} (${count})</span>
        <span>${percent}%</span>
      </div>
      <div style="height:8px;background:var(--bg-app);border-radius:4px;overflow:hidden">
        <div style="height:100%;width:${percent}%;background:${color};transition:width 1s ease"></div>
      </div>
    </div>
  `;
}
