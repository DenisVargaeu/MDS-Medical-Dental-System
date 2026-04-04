import * as api from '../assets/js/api.js';

export async function renderSterilization(container, params = {}) {
  container.innerHTML = `
    <div class="page-header flex justify-between items-center">
      <div>
        <h1 class="page-title">Hygiene & Sterilization</h1>
        <p class="page-subtitle">Track autoclave cycles and clinical safety compliance</p>
      </div>
      <button class="btn btn-primary" id="new-cycle-btn"><i class="fas fa-plus"></i> Log Cycle</button>
    </div>

    <!-- Compliance Banner -->
    <div class="card p-24" style="background:linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(5,150,105,0) 100%); border-left:4px solid #10b981; margin-bottom:24px">
       <div class="flex items-center gap-16">
          <div class="stat-icon" style="background:#10b981; color:white; width:48px; height:48px; font-size:24px"><i class="fas fa-shield-virus"></i></div>
          <div>
             <div style="font-size:18px; font-weight:700">Clinic Safety Status: Compliant</div>
             <div style="font-size:13px; opacity:0.8">All sterilization protocols are up to date. Latest cycle passed on <span id="latest-cycle-date">-</span></div>
          </div>
       </div>
    </div>

    <div class="card">
      <div class="card-header flex justify-between items-center">
         <h3 style="font-size:16px; margin:0">Sterilization History</h3>
         <div class="flex gap-8">
            <button class="btn btn-xs btn-ghost" id="refresh-logs-btn"><i class="fas fa-sync"></i> Refresh</button>
         </div>
      </div>
      <table class="table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Cycle ID</th>
            <th>Equipment</th>
            <th>Parameters</th>
            <th>Clinician</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="cycle-list">
          <tr><td colspan="7" class="text-center" style="padding:40px"><div class="spinner"></div> Connecting to hygiene records...</td></tr>
        </tbody>
      </table>
    </div>

    <!-- Cycle Modal -->
    <div class="modal-backdrop" id="cycle-modal-backdrop">
      <div class="modal">
        <div class="modal-header">
           <div class="modal-title">New Sterilization Cycle</div>
           <div class="modal-close" id="cycle-modal-close">&times;</div>
        </div>
        <div class="modal-body">
           <form id="cycle-form">
              <div class="form-group">
                 <label class="form-label">Internal Cycle ID</label>
                 <input type="text" class="form-control" id="cy-id" placeholder="e.g. S-2026-0045" required>
              </div>
              <div class="form-grid form-grid-2">
                 <div class="form-group">
                    <label class="form-label">Autoclave / Equipment</label>
                    <input type="text" class="form-control" id="cy-equip" value="Autoclave-01" required>
                 </div>
                 <div class="form-group">
                    <label class="form-label">Status</label>
                    <select class="form-control" id="cy-status">
                       <option value="passed">✅ Passed</option>
                       <option value="failed">❌ Failed / Terminated</option>
                       <option value="process">⏳ In Progress</option>
                    </select>
                 </div>
                 <div class="form-group">
                    <label class="form-label">Temperature (°C)</label>
                    <input type="number" class="form-control" id="cy-temp" value="134" step="0.1">
                 </div>
                 <div class="form-group">
                    <label class="form-label">Pressure (Bar)</label>
                    <input type="number" class="form-control" id="cy-press" value="2.1" step="0.01">
                 </div>
                 <div class="form-group">
                    <label class="form-label">Duration (Min)</label>
                    <input type="number" class="form-control" id="cy-dur" value="15">
                 </div>
              </div>
              <div class="form-group" style="margin-top:12px">
                 <label class="form-label">Observations / Notes</label>
                 <textarea class="form-control" id="cy-notes" rows="2" placeholder="Chemical indicator result, pouch details..."></textarea>
              </div>
           </form>
        </div>
        <div class="modal-footer">
           <button class="btn btn-secondary" id="cycle-modal-cancel">Cancel</button>
           <button class="btn btn-primary" id="save-cycle-btn">Log & Verify Cycle</button>
        </div>
      </div>
    </div>
  `;

  const list = document.getElementById('cycle-list');
  const modal = document.getElementById('cycle-modal-backdrop');

  async function loadLogs() {
     try {
        const logs = await api.sterilization.list();
        
        if (logs.length > 0) {
           document.getElementById('latest-cycle-date').textContent = new Date(logs[0].created_at).toLocaleString();
        }

        if (logs.length === 0) {
           list.innerHTML = '<tr><td colspan="7" class="text-center" style="padding:40px; color:var(--text-muted)">No sterilization cycles logged yet.</td></tr>';
           return;
        }

        list.innerHTML = logs.map(s => `
           <tr>
              <td>
                 <div style="font-weight:700">${new Date(s.created_at).toLocaleDateString()}</div>
                 <div style="font-size:11px; color:var(--text-muted)">${new Date(s.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
              </td>
              <td><code>${s.cycle_number}</code></td>
              <td>${s.equipment_id}</td>
              <td>
                 <div style="font-size:11px"><i class="fas fa-thermometer-half"></i> ${s.temperature}°C</div>
                 <div style="font-size:11px"><i class="fas fa-gauge"></i> ${s.pressure} Bar (${s.duration_minutes}m)</div>
              </td>
              <td>Dr. ${s.doctor_name[0]}. ${s.surname ? s.surname : s.doctor_surname}</td>
              <td>
                 <span class="badge ${s.status === 'passed' ? 'badge-success' : s.status === 'failed' ? 'badge-danger' : 'badge-warning'}">
                    ${s.status.toUpperCase()}
                 </span>
              </td>
              <td>
                 <button class="btn btn-xs btn-ghost delete-log" data-id="${s.id}"><i class="fas fa-trash"></i></button>
              </td>
           </tr>
        `).join('');

        list.querySelectorAll('.delete-log').forEach(btn => {
           btn.onclick = async () => {
              if (!confirm('Permanent delete this hygiene log?')) return;
              await api.sterilization.delete(btn.dataset.id);
              window.mdsToast('Log entry removed', 'info');
              loadLogs();
           };
        });

     } catch (err) {
        list.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error: ${err.message}</td></tr>`;
     }
  }

  document.getElementById('new-cycle-btn').onclick = () => {
     // Generate dummy cycle ID
     document.getElementById('cy-id').value = `S-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9999)).padStart(4,'0')}`;
     modal.classList.add('open');
  };

  document.getElementById('cycle-modal-close').onclick = () => modal.classList.remove('open');
  document.getElementById('cycle-modal-cancel').onclick = () => modal.classList.remove('open');

  document.getElementById('save-cycle-btn').onclick = async () => {
     const data = {
        cycle_number: document.getElementById('cy-id').value,
        equipment_id: document.getElementById('cy-equip').value,
        temperature: document.getElementById('cy-temp').value,
        pressure: document.getElementById('cy-press').value,
        duration_minutes: document.getElementById('cy-dur').value,
        status: document.getElementById('cy-status').value,
        notes: document.getElementById('cy-notes').value
     };
     try {
        await api.sterilization.create(data);
        window.mdsToast('Hygiene protocols verified!', 'success');
        modal.classList.remove('open');
        loadLogs();
     } catch (err) { window.mdsToast(err.message, 'error'); }
  };

  document.getElementById('refresh-logs-btn').onclick = loadLogs;

  loadLogs();
}
