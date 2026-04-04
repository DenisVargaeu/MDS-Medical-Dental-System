import * as api from '../assets/js/api.js';

export async function renderRecords(container, params = {}) {
  let allTreatments = [];
  try { allTreatments = await api.treatments.list(); } catch (_) {}

  container.innerHTML = `
    <div class="page-header flex justify-between items-center">
      <div class="page-title">
        <h2>Clinical Patient Profile</h2>
        <p>Medical records, vital signs, and treatment progress</p>
      </div>
      ${params.patientId ? `
      <div class="flex gap-8">
        <button class="btn btn-secondary" id="new-vitals-btn"><i class="fas fa-heartbeat"></i> Record Vitals</button>
        <button class="btn btn-primary" id="new-record-btn"><i class="fas fa-file-medical"></i> New Record</button>
      </div>` : ''}
    </div>

    ${params.patientId ? `
    <div class="tabs" style="margin-bottom:24px">
      <div class="tab-btn active" data-tab="records-tab">Medical History</div>
      <div class="tab-btn" data-tab="vitals-tab">Vital Signs & Vitals History</div>
    </div>` : `
    <div class="card" style="margin-bottom:16px;padding:12px 16px">
      <input class="form-control" id="rpatient-id" type="number" placeholder="Enter Patient ID to view clinical data">
      <button class="btn btn-primary" id="search-rec-btn" style="margin-top:8px">Load Profile</button>
    </div>`}

    <div id="tab-content-records" class="tab-content active">
      <div id="records-container"></div>
    </div>

    <div id="tab-content-vitals" class="tab-content">
      <div id="vitals-container"></div>
    </div>

    ${newRecordModal(allTreatments, params.patientId)}
    ${newVitalsModal(params.patientId)}
  `;

  // Tab Logic
  document.querySelectorAll('.tab-btn').forEach(btn => {
     btn.onclick = () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`tab-content-${btn.dataset.tab.split('-')[0]}`).classList.add('active');
        if (btn.dataset.tab === 'vitals-tab') loadVitals(params.patientId);
     };
  });

  if (params.patientId) {
    await loadRecords(params.patientId);
    document.getElementById('new-record-btn')?.addEventListener('click', () => openModal('rec-modal-backdrop'));
    document.getElementById('new-vitals-btn')?.addEventListener('click', () => openModal('vitals-modal-backdrop'));
  } else {
    document.getElementById('search-rec-btn')?.addEventListener('click', async () => {
      const pid = document.getElementById('rpatient-id').value;
      if (pid) {
          params.patientId = pid;
          await loadRecords(pid);
          // Re-render to show tabs if patient found? No, simpler to just keep state.
      }
    });
  }

  // General Modal Events
  document.querySelectorAll('.modal-backdrop').forEach(mb => {
     mb.onclick = (e) => { if (e.target === mb) mb.classList.remove('open'); };
  });
  const saveRecBtn = document.getElementById('save-record-btn');
  if (saveRecBtn) saveRecBtn.onclick = () => saveRecord(params.patientId);

  const saveVitBtn = document.getElementById('save-vitals-btn');
  if (saveVitBtn) saveVitBtn.onclick = () => saveVitals(params.patientId);

  async function loadRecords(patientId) {
    const rc = document.getElementById('records-container');
    rc.innerHTML = `<div class="loading-overlay"><div class="spinner"></div></div>`;
    try {
      const resp = await api.records.list({ patient_id: patientId });
      const recs = Array.isArray(resp) ? resp : (resp.data || []);
      
      if (recs.length === 0) {
        rc.innerHTML = `<div class="card p-40 text-center col-span-3 text-muted">No clinical records found.</div>`;
        return;
      }
      rc.innerHTML = `
        <div class="timeline" style="position:relative; padding-left:32px">
           <div style="position:absolute; left:12px; top:0; bottom:0; width:2px; background:var(--border)"></div>
           ${recs.map(r => `
           <div class="card" style="margin-bottom:20px; border-left:4px solid var(--primary); animation: slideUp 0.4s ease">
              <div class="card-header" style="cursor:pointer" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'">
                 <div>
                    <div style="font-weight:700">${new Date(r.visit_date).toLocaleDateString('sk-SK', {year:'numeric',month:'long',day:'numeric'})}</div>
                    <div style="font-size:12px; color:var(--text-muted)">Dr. ${r.doctor_name} ${r.doctor_surname}</div>
                 </div>
                 <i class="fas fa-chevron-down"></i>
              </div>
              <div class="card-body" style="display:none; padding:20px">
                 <div class="form-group"><label class="form-label">Chief Complaint</label><p>${r.chief_complaint || 'N/A'}</p></div>
                 <div class="form-group"><label class="form-label">Clinical Findings</label><p>${r.clinical_findings || 'N/A'}</p></div>
                 <div class="form-group"><label class="form-label">Treatment Notes</label><p>${r.doctor_notes || 'N/A'}</p></div>
              </div>
           </div>`).join('')}
        </div>`;
    } catch (err) {
      rc.innerHTML = `<div class="empty-state text-danger"><h3>${err.message}</h3></div>`;
    }
  }

  async function loadVitals(patientId) {
     const vc = document.getElementById('vitals-container');
     vc.innerHTML = `<div class="loading-overlay"><div class="spinner"></div></div>`;
     try {
        const rows = await api.vitals.list(patientId);
        if (rows.length === 0) {
           vc.innerHTML = `<div class="card p-40 text-center text-muted">No vital signs recorded for this patient.</div>`;
           return;
        }

        vc.innerHTML = `
           <div class="grid grid-2 gap-20">
              ${rows.map(v => `
                 <div class="card p-20 animate-slide-up">
                    <div class="flex justify-between items-center" style="margin-bottom:16px">
                       <div style="font-weight:700; color:var(--primary)">${new Date(v.recorded_at).toLocaleString('sk-SK')}</div>
                       <div class="badge badge-outline">${v.doctor_name} ${v.doctor_surname}</div>
                    </div>
                    <div class="grid grid-3 gap-12">
                       <div class="vitals-point">
                          <span class="form-label">BP</span>
                          <div style="font-size:18px; font-weight:700; color:${parseInt(v.blood_pressure) > 140 ? 'var(--danger)' : 'var(--text-primary)'}">${v.blood_pressure || '--'}</div>
                          <span style="font-size:10px; color:var(--text-muted)">mmHg</span>
                       </div>
                       <div class="vitals-point">
                          <span class="form-label">Pulse</span>
                          <div style="font-size:18px; font-weight:700">${v.pulse || '--'}</div>
                          <span style="font-size:10px; color:var(--text-muted)">bpm</span>
                       </div>
                       <div class="vitals-point">
                          <span class="form-label">BMI</span>
                          <div style="font-size:18px; font-weight:700">${v.bmi || '--'}</div>
                          <span style="font-size:10px; color:var(--text-muted)">kg/m²</span>
                       </div>
                    </div>
                    ${v.notes ? `<div style="margin-top:12px; font-size:12px; color:var(--text-secondary); border-top:1px solid var(--border); padding-top:8px">${v.notes}</div>` : ''}
                 </div>
              `).join('')}
           </div>
        `;
     } catch (err) { vc.innerHTML = `<div class="card p-40 text-danger">${err.message}</div>`; }
  }

  function openModal(id) { document.getElementById(id).classList.add('open'); }

  async function saveRecord(id) {
     const data = {
        patient_id: id,
        visit_date: document.getElementById('r-visit-date').value,
        chief_complaint: document.getElementById('r-complaint').value,
        clinical_findings: document.getElementById('r-findings').value,
        doctor_notes: document.getElementById('r-notes').value,
        follow_up_date: document.getElementById('r-followup').value || null
     };
     try {
        await api.records.create(data);
        window.mdsToast('Clinical record saved!', 'success');
        document.getElementById('rec-modal-backdrop').classList.remove('open');
        loadRecords(id);
     } catch (err) { window.mdsToast(err.message, 'error'); }
  }

  async function saveVitals(id) {
     const data = {
        patient_id: id,
        blood_pressure: document.getElementById('v-bp').value,
        pulse: document.getElementById('v-pulse').value,
        temperature: document.getElementById('v-temp').value,
        weight_kg: document.getElementById('v-weight').value,
        height_cm: document.getElementById('v-height').value,
        bmi: document.getElementById('v-bmi').value,
        oxygen_saturation: document.getElementById('v-spo2').value,
        notes: document.getElementById('v-notes').value
     };
     try {
        await api.vitals.create(data);
        window.mdsToast('Vitals recorded successfully!', 'success');
        document.getElementById('vitals-modal-backdrop').classList.remove('open');
        loadVitals(id);
     } catch (err) { window.mdsToast(err.message, 'error'); }
  }
}

function newRecordModal(treatments, patientId) {
  const today = new Date().toISOString().split('T')[0];
  return `
  <div class="modal-backdrop" id="rec-modal-backdrop">
    <div class="modal modal-lg">
      <div class="modal-header"><div class="modal-title">New Medical Record</div><div class="modal-close" onclick="this.closest('.modal-backdrop').classList.remove('open')">&times;</div></div>
      <div class="modal-body">
        <div class="form-group"><label class="form-label">Visit Date</label><input class="form-control" type="date" id="r-visit-date" value="${today}"></div>
        <div class="form-group"><label class="form-label">Chief Complaint</label><textarea class="form-control" id="r-complaint" rows="2"></textarea></div>
        <div class="form-group"><label class="form-label">Clinical Findings</label><textarea class="form-control" id="r-findings" rows="2"></textarea></div>
        <div class="form-group"><label class="form-label">Doctor Notes</label><textarea class="form-control" id="r-notes" rows="4"></textarea></div>
        <div class="form-group"><label class="form-label">Follow-up</label><input class="form-control" type="date" id="r-followup"></div>
      </div>
      <div class="modal-footer"><button class="btn btn-primary" id="save-record-btn">Save Record</button></div>
    </div>
  </div>`;
}

function newVitalsModal(pid) {
   return `
   <div class="modal-backdrop" id="vitals-modal-backdrop">
     <div class="modal modal-lg">
        <div class="modal-header"><div class="modal-title">Record Patient Vitals</div><div class="modal-close" onclick="this.closest('.modal-backdrop').classList.remove('open')">&times;</div></div>
        <div class="modal-body">
           <div class="form-grid form-grid-3">
              <div class="form-group"><label class="form-label">Blood Pressure (mmHg)</label><input class="form-control" id="v-bp" placeholder="e.g. 120/80"></div>
              <div class="form-group"><label class="form-label">Pulse (bpm)</label><input class="form-control" type="number" id="v-pulse"></div>
              <div class="form-group"><label class="form-label">Temperature (°C)</label><input class="form-control" type="number" step="0.1" id="v-temp"></div>
              <div class="form-group"><label class="form-label">Weight (kg)</label><input class="form-control" type="number" step="0.1" id="v-weight" oninput="document.getElementById('v-bmi').value = (this.value / Math.pow(document.getElementById('v-height').value/100, 2)).toFixed(1)"></div>
              <div class="form-group"><label class="form-label">Height (cm)</label><input class="form-control" type="number" id="v-height" oninput="document.getElementById('v-bmi').value = (document.getElementById('v-weight').value / Math.pow(this.value/100, 2)).toFixed(1)"></div>
              <div class="form-group"><label class="form-label">BMI (Calculated)</label><input class="form-control" id="v-bmi" readonly></div>
              <div class="form-group"><label class="form-label">SpO2 (%)</label><input class="form-control" type="number" id="v-spo2"></div>
           </div>
           <div class="form-group"><label class="form-label">Clinical Notes</label><textarea class="form-control" id="v-notes"></textarea></div>
        </div>
        <div class="modal-footer"><button class="btn btn-primary" id="save-vitals-btn">Save Vitals</button></div>
     </div>
   </div>`;
}
