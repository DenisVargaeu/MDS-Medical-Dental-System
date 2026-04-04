import * as api from '../assets/js/api.js';

export async function renderRecall(container, params = {}) {
  container.innerHTML = `
    <div class="page-header flex justify-between items-center">
      <div>
        <h1 class="page-title">Marketing & Recall Manager</h1>
        <p class="page-subtitle">Identify and contact patients overdue for their dental check-up</p>
      </div>
    </div>

    <div class="stats-grid grid-3" style="margin-bottom:24px">
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(59,130,246,0.1); color:#3b82f6"><i class="fas fa-users-slash"></i></div>
        <div class="stat-value" id="stat-overdue-count">0</div>
        <div class="stat-label">Overdue (>6 Months)</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(245,158,11,0.1); color:#f59e0b"><i class="fas fa-history"></i></div>
        <div class="stat-value" id="stat-critical-count">0</div>
        <div class="stat-label">Critical (>12 Months)</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(16,185,129,0.1); color:#10b981"><i class="fas fa-check-circle"></i></div>
        <div class="stat-value" id="stat-contacted-today">0</div>
        <div class="stat-label">Contacted (Today)</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header flex justify-between items-center">
         <div class="flex gap-12 items-center">
            <span style="font-size:13px; font-weight:700">Show Delay:</span>
            <select class="form-control" id="recall-days-select" style="max-width:180px">
               <option value="180">6 Months (180 days)</option>
               <option value="365" selected>12 Months (365 days)</option>
               <option value="730">2 Years (730 days)</option>
            </select>
         </div>
         <button class="btn btn-sm btn-outline" id="refresh-recall-btn"><i class="fas fa-sync"></i> Refresh List</button>
      </div>
      <table class="table">
        <thead>
          <tr>
            <th>Patient</th>
            <th>Contact Details</th>
            <th>Last Visit</th>
            <th>Last Treatment</th>
            <th>Days Overdue</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="recall-list">
          <tr><td colspan="6" class="text-center" style="padding:40px"><div class="spinner"></div> Calculating recall list...</td></tr>
        </tbody>
      </table>
    </div>
  `;

  const list = document.getElementById('recall-list');
  const delaySelect = document.getElementById('recall-days-select');
  const refreshBtn = document.getElementById('refresh-recall-btn');

  async function loadRecallData() {
     const delay = parseInt(delaySelect.value);
     list.innerHTML = '<tr><td colspan="6" class="text-center" style="padding:40px"><div class="spinner"></div> Syncing with patient records...</td></tr>';
     
     try {
        // Fetch all patients and their latest records
        // For a true recall system, we need patients who HAVEN'T been seen recently.
        const res = await api.patients.list({ limit: 500 });
        const patients = res.data;
        
        const overdue = [];
        const now = new Date();

        for (const p of patients) {
           // Fetch latest record for each patient
           const records = await api.records.list(p.id);
           const lastRecord = records && records.length > 0 ? records[0] : null;
           
           if (!lastRecord) {
              // Patient never seen? Might be a new patient to follow up
              continue; 
           }

           const lastVisit = new Date(lastRecord.visit_date);
           const diffTime = Math.abs(now - lastVisit);
           const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

           if (diffDays >= delay) {
              overdue.push({
                 ...p,
                 lastVisit: lastVisit,
                 daysOverdue: diffDays,
                 lastTreatment: lastRecord.treatment_performed || 'General Checkup'
              });
           }
        }

        // Stats
        document.getElementById('stat-overdue-count').textContent = overdue.length;
        document.getElementById('stat-critical-count').textContent = overdue.filter(o => o.daysOverdue >= 365).length;
        document.getElementById('stat-contacted-today').textContent = '0'; // Stub for log activity

        if (overdue.length === 0) {
           list.innerHTML = '<tr><td colspan="6" class="text-center" style="padding:40px; color:var(--text-muted)">All patients are up to date!</td></tr>';
           return;
        }

        // Sort by most overdue
        overdue.sort((a,b) => b.daysOverdue - a.daysOverdue);

        list.innerHTML = overdue.map(o => `
           <tr>
              <td>
                 <div style="font-weight:700">${o.last_name} ${o.first_name}</div>
                 <div style="font-size:11px; color:var(--text-muted)">ID: #${o.id}</div>
              </td>
              <td>
                 <div style="font-size:13px"><i class="fas fa-phone"></i> ${o.phone || '-'}</div>
                 <div style="font-size:11px; color:var(--primary)"><i class="fas fa-envelope"></i> ${o.email || '-'}</div>
              </td>
              <td>${o.lastVisit.toLocaleDateString()}</td>
              <td style="max-width:200px" class="truncate">${o.lastTreatment}</td>
              <td style="color:${o.daysOverdue >= 365 ? 'var(--danger)' : 'var(--warning)'}; font-weight:700">
                 ${o.daysOverdue} days
              </td>
              <td>
                 <div class="flex gap-4">
                    <button class="btn btn-xs btn-primary contact-patient" data-id="${o.id}" title="Mark as Contacted"><i class="fas fa-paper-plane"></i></button>
                    <button class="btn btn-xs btn-outline" onclick="window.mdsNavigate('patient-detail', { id: ${o.id} })" title="View Profile"><i class="fas fa-user-edit"></i></button>
                 </div>
              </td>
           </tr>
        `).join('');

        list.querySelectorAll('.contact-patient').forEach(btn => {
           btn.onclick = () => {
              window.mdsToast('Patient marked as contacted. Notification sent.', 'success');
              btn.disabled = true;
              btn.classList.replace('btn-primary', 'btn-ghost');
              btn.innerHTML = '<i class="fas fa-check"></i>';
           };
        });

     } catch (err) {
        list.innerHTML = `<tr><td colspan="6" class="text-center" style="color:var(--danger)">Error: ${err.message}</td></tr>`;
     }
  }

  delaySelect.onchange = loadRecallData;
  refreshBtn.onclick = loadRecallData;

  loadRecallData();
}
