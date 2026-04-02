import * as api from '../assets/js/api.js';

export async function renderRecords(container, params = {}) {
  let allTreatments = [];
  try { allTreatments = await api.treatments.list(); } catch (_) {}

  container.innerHTML = `
  <div class="page-header">
    <div class="page-title"><h2>Medical Records</h2><p>Clinical visit records and treatment history</p></div>
    ${params.patientId ? `<button class="btn btn-primary" id="new-record-btn"><i class="fas fa-file-medical"></i> New Record</button>` : ''}
  </div>
  ${params.patientId ? '' : `
  <div class="card" style="margin-bottom:16px;padding:12px 16px">
    <input class="form-control" id="rpatient-id" type="number" placeholder="Enter Patient ID to view records">
    <button class="btn btn-primary" id="search-rec-btn" style="margin-top:8px">Load Records</button>
  </div>`}
  <div id="records-container"></div>
  ${newRecordModal(allTreatments, params.patientId)}`;

  if (params.patientId) {
    await loadRecords(params.patientId);
    document.getElementById('new-record-btn')?.addEventListener('click', () => openRecordModal());
  } else {
    document.getElementById('search-rec-btn')?.addEventListener('click', async () => {
      const pid = document.getElementById('rpatient-id').value;
      if (pid) await loadRecords(pid);
    });
  }

  document.getElementById('rec-modal-backdrop')?.addEventListener('click', e => { if (e.target.id === 'rec-modal-backdrop') closeRecordModal(); });
  document.getElementById('rec-modal-close')?.addEventListener('click', closeRecordModal);
  document.getElementById('save-record-btn')?.addEventListener('click', () => saveRecord(params.patientId));

  async function loadRecords(patientId) {
    const rc = document.getElementById('records-container');
    rc.innerHTML = `<div class="loading-overlay"><div class="spinner"></div></div>`;
    try {
      const data = await api.records.list({ patient_id: patientId });
      const recs = data.data;
      if (recs.length === 0) {
        rc.innerHTML = `<div class="card"><div class="empty-state"><div class="empty-state-icon"><i class="fas fa-file-prescription"></i></div><h3>No records found</h3><p>Create the first medical record for this patient</p></div></div>`;
        return;
      }
      rc.innerHTML = `<div style="position:relative;padding-left:20px">
        <div style="position:absolute;left:0;top:0;bottom:0;width:2px;background:var(--border)"></div>
        ${recs.map(r => `
        <div class="card" style="margin-bottom:16px;padding:0;position:relative" id="rec-${r.id}">
          <div style="position:absolute;left:-25px;top:18px;width:12px;height:12px;border-radius:50%;background:var(--primary);border:2px solid var(--bg-app)"></div>
          <div class="card-header" style="cursor:pointer" onclick="toggleRecord(${r.id})">
            <div>
              <div style="font-weight:700">${new Date(r.visit_date).toLocaleDateString('sk-SK', {weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div>
              <div style="font-size:12px;color:var(--text-muted)">Dr. ${r.doctor_name} ${r.doctor_surname} · Patient: ${r.first_name} ${r.last_name}</div>
            </div>
            <span style="font-size:16px;color:var(--text-muted)"><i class="fas fa-chevron-down"></i></span>
          </div>
          <div class="rec-body" id="rec-body-${r.id}" style="display:none;padding:16px">
            ${r.chief_complaint ? `<div class="form-group"><strong style="font-size:12px">Chief Complaint</strong><p style="font-size:13px;color:var(--text-secondary);margin-top:4px">${r.chief_complaint}</p></div>` : ''}
            ${r.clinical_findings ? `<div class="form-group"><strong style="font-size:12px">Clinical Findings</strong><p style="font-size:13px;color:var(--text-secondary);margin-top:4px">${r.clinical_findings}</p></div>` : ''}
            ${r.doctor_notes ? `<div class="form-group"><strong style="font-size:12px">Doctor Notes</strong><p style="font-size:13px;margin-top:4px">${r.doctor_notes}</p></div>` : ''}
            ${r.follow_up_date ? `<div class="alert alert-info" style="margin-top:8px"><span><i class="fas fa-calendar-check"></i> Follow-up: ${new Date(r.follow_up_date).toLocaleDateString('sk-SK')}</span></div>` : ''}
          </div>
        </div>`).join('')}
      </div>`;

      window.toggleRecord = (id) => {
        const body = document.getElementById(`rec-body-${id}`);
        body.style.display = body.style.display === 'none' ? 'block' : 'none';
      };
    } catch (err) {
      rc.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><i class="fas fa-exclamation-triangle"></i></div><h3>${err.message}</h3></div>`;
    }
  }

  function openRecordModal() { document.getElementById('rec-modal-backdrop').classList.add('open'); }
  function closeRecordModal() { document.getElementById('rec-modal-backdrop').classList.remove('open'); }

  async function saveRecord(patientId) {
    const btn = document.getElementById('save-record-btn');
    btn.textContent = 'Saving…'; btn.disabled = true;
    try {
      const vd = document.getElementById('r-visit-date').value;
      if (!vd || !patientId) { window.mdsToast('Patient ID and visit date are required', 'error'); return; }
      const data = {
        patient_id: patientId,
        visit_date: vd,
        chief_complaint: document.getElementById('r-complaint').value,
        clinical_findings: document.getElementById('r-findings').value,
        doctor_notes: document.getElementById('r-notes').value,
        follow_up_date: document.getElementById('r-followup').value || null,
      };
      await api.records.create(data);
      window.mdsToast('Record created', 'success');
      closeRecordModal();
      await loadRecords(patientId);
    } catch (err) { window.mdsToast(err.message, 'error'); }
    finally { btn.textContent = 'Save'; btn.disabled = false; }
  }
}

function newRecordModal(treatments, patientId) {
  const today = new Date().toISOString().split('T')[0];
  return `
  <div class="modal-backdrop" id="rec-modal-backdrop">
    <div class="modal modal-lg">
      <div class="modal-header"><div class="modal-title"><i class="fas fa-file-medical"></i> New Medical Record</div><div class="modal-close" id="rec-modal-close"><i class="fas fa-times"></i></div></div>
      <div class="modal-body">
        <div class="form-grid form-grid-2">
          <div class="form-group"><label class="form-label">Visit Date *</label><input class="form-control" type="date" id="r-visit-date" value="${today}"></div>
        </div>
        <div class="form-group"><label class="form-label">Chief Complaint</label><textarea class="form-control" id="r-complaint" rows="2" placeholder="What is the patient's main complaint?"></textarea></div>
        <div class="form-group"><label class="form-label">Clinical Findings</label><textarea class="form-control" id="r-findings" rows="2" placeholder="Examination findings…"></textarea></div>
        <div class="form-group"><label class="form-label">Doctor Notes</label><textarea class="form-control" id="r-notes" rows="3" placeholder="Treatment notes, observations…"></textarea></div>
        <div class="form-group"><label class="form-label">Follow-up Date</label><input class="form-control" type="date" id="r-followup"></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('rec-modal-backdrop').classList.remove('open')">Cancel</button>
        <button class="btn btn-primary" id="save-record-btn">Save Record</button>
      </div>
    </div>
  </div>`;
}
