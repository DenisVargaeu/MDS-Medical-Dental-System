import * as api from '../assets/js/api.js';
import { renderOdontogram } from './odontogram.js';

export async function renderPatientDetail(container, { id }) {
  if (!id) { container.innerHTML = `<div class="empty-state"><h3>No patient selected</h3></div>`; return; }
  try {
    const {
      patient = {},
      allergies = [],
      medications = [],
      diagnoses = [],
      appointments = [],
      records = [],
      files = [],
      invoices = [],
      prescriptions = [],
      labWork = [],
      treatmentPlans = []
    } = await api.patients.get(id);

    const user = window.mdsCurrentUser() || {};
    const isDoctor = user.role === 'doctor' || user.role === 'admin';

    const severityColor = { mild:'badge-warning', moderate:'badge-warning', severe:'badge-danger', unknown:'badge-muted' };
    const invStatus = { paid:'badge-success', issued:'badge-primary', partial:'badge-warning', overdue:'badge-danger', draft:'badge-muted', cancelled:'badge-muted' };
    const apptStatus = { completed:'badge-success', scheduled:'badge-primary', cancelled:'badge-muted', no_show:'badge-danger', in_progress:'badge-warning', confirmed:'badge-info' };

    container.innerHTML = `
    <!-- Back + Header -->
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
      <button class="btn btn-ghost" onclick="mdsNavigateTo('patients')"><i class="fas fa-arrow-left"></i> Back</button>
      <div style="flex:1">
        <h2 style="font-size:22px;font-weight:700">${patient.first_name || 'Patient'} ${patient.last_name || ''}</h2>
        <p style="font-size:13px;color:var(--text-muted)">Patient ID: #${patient.id || id} · Registered: ${patient.created_at ? new Date(patient.created_at).toLocaleDateString('sk-SK') : '—'}</p>
      </div>
      ${patient.warning_flags ? `<div class="alert alert-danger" style="margin:0;padding:8px 14px"><span><i class="fas fa-exclamation-triangle"></i> ${patient.warning_flags}</span></div>` : ''}
      <button class="btn btn-secondary" id="edit-patient-quick"><i class="fas fa-edit"></i> Edit</button>
      <button class="btn btn-primary" id="new-appt-btn"><i class="fas fa-calendar-plus"></i> Appointment</button>
    </div>

    <!-- Patient Summary Row -->
    <div style="display:grid;grid-template-columns:280px 1fr;gap:20px;margin-bottom:20px">
      <div class="card" style="padding:0">
        <div style="padding:24px;text-align:center;border-bottom:1px solid var(--border)">
          <div class="avatar avatar-lg" style="margin:0 auto 12px">${(patient.first_name || 'P')[0]}${(patient.last_name || '')[0] || ''}</div>
          <div style="font-size:17px;font-weight:700">${patient.first_name || ''} ${patient.last_name || ''}</div>
          <div style="font-size:13px;color:var(--text-muted);margin-top:2px">${patient.age ? patient.age + ' years old' : ''} · ${patient.gender || ''}</div>
          <div style="margin-top:10px">
            <span class="badge badge-primary">${patient.blood_type || 'unknown'}</span>
          </div>
        </div>
        <div style="padding:16px">
          ${infoRow('<i class="fas fa-phone"></i>', patient.phone || '—')}
          ${infoRow('<i class="fas fa-envelope"></i>', patient.email || '—')}
          ${infoRow('<i class="fas fa-map-marker-alt"></i>', [patient.address, patient.city, patient.postal_code].filter(Boolean).join(', ') || '—')}
          ${infoRow('<i class="fas fa-id-card"></i>', patient.insurance_number ? `${patient.insurance_number} · ${patient.insurance_company || ''}`.trim() : '—')}
          ${infoRow('<i class="fas fa-briefcase-medical"></i>', patient.emergency_contact_name ? `${patient.emergency_contact_name} (${patient.emergency_contact_phone || '—'})` : '—')}
        </div>
      </div>

      <!-- Tabs (main content) -->
      <div class="card">
        <div class="tabs" style="padding:0 16px">
          ${['Medical','Dental Chart','History','Attachments','Invoices','Prescriptions','Lab Work','Treatment Plans'].map((t,i) =>
            `<button class="tab-btn ${i===0?'active':''}" data-tab="tab-${t.toLowerCase().replace(/ /g,'-')}">${t}</button>`
          ).join('')}
        </div>
        <div style="padding:16px">

          <!-- MEDICAL TAB -->
          <div class="tab-content active" id="tab-medical">
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px">
              <!-- Allergies -->
              <div>
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
                  <h4 style="font-size:13px;font-weight:700;color:var(--danger)"><i class="fas fa-exclamation-circle"></i> Allergies</h4>
                  ${isDoctor ? `<button class="btn btn-sm btn-danger" id="add-allergy-btn"><i class="fas fa-plus"></i></button>` : ''}
                </div>
                <div id="allergies-list">
                  ${allergies.length === 0 ? '<div style="color:var(--text-muted);font-size:12px">None recorded</div>' :
                  allergies.map(a => `
                    <div style="display:flex;align-items:center;gap:6px;padding:6px 0;border-bottom:1px solid var(--border)">
                      <span class="badge ${severityColor[a.severity] || 'badge-muted'}" style="font-size:10px">${a.severity}</span>
                      <span style="font-size:13px;flex:1">${a.name}</span>
                      ${isDoctor ? `<button class="btn btn-sm btn-ghost" onclick="deleteAllergy(${patient.id},${a.id})"><i class="fas fa-times"></i></button>` : ''}
                    </div>`).join('')}
                </div>
              </div>
              <!-- Medications -->
              <div>
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
                  <h4 style="font-size:13px;font-weight:700;color:var(--info)"><i class="fas fa-pills"></i> Medications</h4>
                  ${isDoctor ? `<button class="btn btn-sm btn-secondary" id="add-med-btn"><i class="fas fa-plus"></i></button>` : ''}
                </div>
                ${medications.length === 0 ? '<div style="color:var(--text-muted);font-size:12px">None recorded</div>' :
                medications.map(m => `
                  <div style="padding:6px 0;border-bottom:1px solid var(--border)">
                    <div style="font-size:13px;font-weight:500">${m.name}</div>
                    <div style="font-size:11px;color:var(--text-muted)">${[m.dosage,m.frequency].filter(Boolean).join(' · ')}</div>
                  </div>`).join('')}
              </div>
              <!-- Diagnoses -->
              <div>
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
                  <h4 style="font-size:13px;font-weight:700;color:var(--primary)"><i class="fas fa-stethoscope"></i> Diagnoses</h4>
                  ${isDoctor ? `<button class="btn btn-sm btn-secondary" id="add-diag-btn"><i class="fas fa-plus"></i></button>` : ''}
                </div>
                ${diagnoses.length === 0 ? '<div style="color:var(--text-muted);font-size:12px">None recorded</div>' :
                diagnoses.map(d => `
                  <div style="padding:6px 0;border-bottom:1px solid var(--border)">
                    <div style="font-size:13px;font-weight:500">${d.description}</div>
                    <div style="font-size:11px;color:var(--text-muted)">${d.icd_code ? d.icd_code + ' · ' : ''}${d.diagnosed_at ? new Date(d.diagnosed_at).toLocaleDateString('sk-SK') : ''}</div>
                  </div>`).join('')}
              </div>
            </div>
            ${patient.notes ? `<div class="alert alert-info" style="margin-top:16px"><span class="alert-icon"><i class="fas fa-sticky-note"></i></span> <span>${patient.notes}</span></div>` : ''}
          </div>

          <!-- DENTAL CHART TAB -->
          <div class="tab-content" id="tab-dental-chart">
            <div id="odontogram-container"></div>
          </div>

          <!-- HISTORY TAB -->
          <div class="tab-content" id="tab-history">
            <h4 style="font-size:13px;font-weight:700;margin-bottom:12px"><i class="fas fa-history"></i> Recent Medical Records</h4>
            ${records.length === 0 ? '<div class="empty-state" style="padding:30px"><div class="empty-state-icon"><i class="fas fa-file-invoice"></i></div><h3>No records yet</h3></div>' :
            `<div style="position:relative;padding-left:16px">
              <div style="position:absolute;left:0;top:0;bottom:0;width:2px;background:var(--border)"></div>
              ${records.map(r => `
                <div style="margin-bottom:16px;position:relative">
                  <div style="position:absolute;left:-21px;top:6px;width:10px;height:10px;border-radius:50%;background:var(--primary);border:2px solid var(--bg-card)"></div>
                  <div class="card" style="padding:14px">
                    <div style="display:flex;align-items:center;justify-content:space-between">
                      <strong>${new Date(r.visit_date).toLocaleDateString('sk-SK', {weekday:'long',year:'numeric',month:'long',day:'numeric'})}</strong>
                      <span style="font-size:12px;color:var(--text-muted)">Dr. ${r.doctor_name} ${r.doctor_surname}</span>
                    </div>
                    ${r.chief_complaint ? `<div style="font-size:13px;color:var(--text-secondary);margin-top:6px"><strong>Complaint:</strong> ${r.chief_complaint}</div>` : ''}
                    ${r.doctor_notes ? `<div style="font-size:13px;margin-top:4px">${r.doctor_notes}</div>` : ''}
                  </div>
                </div>`).join('')}
            </div>`}
            ${isDoctor ? `<button class="btn btn-primary" onclick="mdsNavigateTo('records',{patientId:${patient.id}})">+ New Medical Record</button>` : ''}
          </div>

          <!-- ATTACHMENTS TAB -->
          <div class="tab-content" id="tab-attachments">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
              <h4 style="font-size:13px;font-weight:700"><i class="fas fa-paperclip"></i> Files & Attachments</h4>
              <button class="btn btn-sm btn-primary" id="upload-file-btn">Upload File</button>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px" id="files-grid">
              ${files.length === 0 ? '<div class="empty-state" style="padding:30px;grid-column:1/-1"><div class="empty-state-icon">📁</div><h3>No files</h3></div>' :
              files.map(f => {
                const isImg = f.mime_type?.startsWith('image/');
                const icon = isImg ? '<i class="fas fa-image"></i>' : f.mime_type === 'application/pdf' ? '<i class="fas fa-file-pdf"></i>' : '<i class="fas fa-file"></i>';
                return `<div class="card" style="padding:12px;text-align:center;cursor:pointer;transition:var(--transition)" onclick="openFile(${f.id})">
                  <div style="font-size:32px;margin-bottom:8px;color:var(--primary)">${icon}</div>
                  <div style="font-size:11px;font-weight:600;word-break:break-all;color:var(--text-primary)">${f.original_name.slice(0,25)}${f.original_name.length>25?'…':''}</div>
                  <div style="font-size:10px;color:var(--text-muted);margin-top:4px">${f.category} · ${Math.round((f.size_bytes||0)/1024)}KB</div>
                </div>`;
              }).join('')}
            </div>
          </div>

          <!-- INVOICES TAB -->
          <div class="tab-content" id="tab-invoices">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
              <h4 style="font-size:13px;font-weight:700"><i class="fas fa-file-invoice-dollar"></i> Invoices</h4>
              <button class="btn btn-sm btn-primary" onclick="mdsNavigateTo('finance',{patientId:${patient.id}})">View Finance</button>
            </div>
            ${invoices.length === 0 ? '<div class="empty-state" style="padding:30px"><div class="empty-state-icon"><i class="fas fa-file-invoice-dollar"></i></div><h3>No invoices</h3></div>' :
            `<table><thead><tr><th>Invoice #</th><th>Date</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead>
            <tbody>
              ${invoices.map(inv => `<tr>
                <td style="font-size:12px;font-family:monospace">${inv.invoice_number}</td>
                <td>${new Date(inv.issue_date).toLocaleDateString('sk-SK')}</td>
                <td>€${parseFloat(inv.total).toFixed(2)}</td>
                <td>€${parseFloat(inv.paid_amount).toFixed(2)}</td>
                <td style="font-weight:600;color:${parseFloat(inv.balance)>0?'var(--danger)':'var(--success)'}">€${parseFloat(inv.balance).toFixed(2)}</td>
                <td><span class="badge ${invStatus[inv.status]||'badge-muted'}">${inv.status}</span></td>
              </tr>`).join('')}
            </tbody></table>`}
          </div>

          <!-- PRESCRIPTIONS TAB -->
          <div class="tab-content" id="tab-prescriptions">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
              <h4 style="font-size:13px;font-weight:700"><i class="fas fa-pills"></i> Prescriptions</h4>
              <button class="btn btn-sm btn-primary" onclick="mdsNavigateTo('prescriptions',{patientId:${patient.id}})">Full History</button>
            </div>
            ${prescriptions.length === 0 ? '<div class="empty-state" style="padding:30px"><div class="empty-state-icon"><i class="fas fa-prescription"></i></div><h3>No prescriptions</h3></div>' :
            `<table><thead><tr><th>Date</th><th>Medications</th><th>Status</th></tr></thead>
            <tbody>${prescriptions.map(p => `<tr>
              <td>${new Date(p.date).toLocaleDateString('sk-SK')}</td>
              <td><div style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.medications}</div></td>
              <td><span class="badge badge-${p.status === 'active' ? 'success' : 'muted'}">${p.status}</span></td>
            </tr>`).join('')}</tbody></table>`}
          </div>

          <!-- LAB WORK TAB -->
          <div class="tab-content" id="tab-lab-work">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
              <h4 style="font-size:13px;font-weight:700"><i class="fas fa-microscope"></i> Lab Orders</h4>
              <button class="btn btn-sm btn-primary" onclick="mdsNavigateTo('lab-work',{patientId:${patient.id}})">Full History</button>
            </div>
            ${labWork.length === 0 ? '<div class="empty-state" style="padding:30px"><div class="empty-state-icon"><i class="fas fa-microscope"></i></div><h3>No lab orders</h3></div>' :
            `<table><thead><tr><th>Order Date</th><th>Lab Name</th><th>Work Type</th><th>Status</th></tr></thead>
            <tbody>${labWork.map(l => `<tr>
              <td>${new Date(l.order_date).toLocaleDateString('sk-SK')}</td>
              <td>${l.lab_name}</td>
              <td>${l.work_type}</td>
              <td><span class="badge badge-${l.status === 'received' ? 'success' : 'primary'}">${l.status}</span></td>
            </tr>`).join('')}</tbody></table>`}
          </div>

          <!-- TREATMENT PLANS TAB -->
          <div class="tab-content" id="tab-treatment-plans">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
              <h4 style="font-size:13px;font-weight:700"><i class="fas fa-project-diagram"></i> Treatment Plans</h4>
              <button class="btn btn-sm btn-primary" onclick="mdsNavigateTo('treatment-plans',{patientId:${patient.id}})">Manage Plans</button>
            </div>
            ${treatmentPlans.length === 0 ? '<div class="empty-state" style="padding:30px"><div class="empty-state-icon"><i class="fas fa-project-diagram"></i></div><h3>No treatment plans</h3></div>' :
            `<table><thead><tr><th>Title</th><th>Created</th><th>Status</th></tr></thead>
            <tbody>${treatmentPlans.map(tp => `<tr>
              <td><strong>${tp.title}</strong></td>
              <td>${new Date(tp.created_at).toLocaleDateString('sk-SK')}</td>
              <td><span class="badge badge-${tp.status === 'active' ? 'primary' : 'muted'}">${tp.status}</span></td>
            </tr>`).join('')}</tbody></table>`}
          </div>
        </div>
      </div>
    </div>

    <!-- Upcoming appointments -->
    <div class="card">
      <div class="card-header">
        <div class="card-title"><i class="fas fa-calendar-alt"></i> Appointments</div>
        <button class="btn btn-sm btn-primary" id="new-appt-btn2">+ New</button>
      </div>
      <div class="table-wrapper">
        ${appointments.length === 0 ? '<div class="empty-state" style="padding:30px"><div class="empty-state-icon"><i class="fas fa-calendar-times"></i></div><h3>No appointments</h3></div>' :
        `<table><thead><tr><th>Date</th><th>Time</th><th>Doctor</th><th>Type</th><th>Status</th></tr></thead>
        <tbody>${appointments.map(a => `<tr>
          <td>${new Date(a.date).toLocaleDateString('sk-SK')}</td>
          <td>${a.time?.slice(0,5)||'—'}</td>
          <td>Dr. ${a.doctor_name} ${a.doctor_surname}</td>
          <td>${a.type||'—'}</td>
          <td><span class="badge ${apptStatus[a.status]||'badge-muted'}">${a.status}</span></td>
        </tr>`).join('')}</tbody></table>`}
      </div>
    </div>

    <!-- Inline modals for quick add -->
    ${allergyModal(patient.id)} ${medModal(patient.id)} ${diagModal(patient.id)}`;

    // Tab switching
    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const tabContent = document.getElementById(btn.dataset.tab);
        tabContent.classList.add('active');
        
        if (btn.dataset.tab === 'tab-dental-chart') {
          renderOdontogram(document.getElementById('odontogram-container'), id);
        }
      });
    });

    // Allergy / med / diag handlers
    if (isDoctor) {
      document.getElementById('add-allergy-btn')?.addEventListener('click', () => document.getElementById('allergy-modal-backdrop').classList.add('open'));
      document.getElementById('add-med-btn')?.addEventListener('click', () => document.getElementById('med-modal-backdrop').classList.add('open'));
      document.getElementById('add-diag-btn')?.addEventListener('click', () => document.getElementById('diag-modal-backdrop').classList.add('open'));
    }

    // Upload file
    document.getElementById('upload-file-btn')?.addEventListener('click', async () => {
      const result = await window.electron?.openFileDialog({ multiSelections: false });
      if (!result || result.canceled) return;
      const filePath = result.filePaths[0];
      // For Electron we use fetch with FormData — create a file from path
      window.mdsToast('File upload requires backend connection with file path access', 'info');
    });

    // Global functions for onclick
    window.deleteAllergy = async (pid, aid) => {
      if (!confirm('Delete this allergy?')) return;
      try { await api.patients.deleteAllergy(pid, aid); window.mdsToast('Allergy removed', 'success'); window.mdsNavigateTo('patient-detail', { id: pid }); }
      catch (err) { window.mdsToast(err.message, 'error'); }
    };
    window.openFile = (fid) => { window.open(api.files.downloadUrl(fid)); };

    // New appointment quick-button
    const newApptHandler = () => window.mdsNavigateTo('appointments', { patientId: id });
    document.getElementById('new-appt-btn')?.addEventListener('click', newApptHandler);
    document.getElementById('new-appt-btn2')?.addEventListener('click', newApptHandler);

    // Quick-add allergy form
    document.getElementById('save-allergy-btn')?.addEventListener('click', async () => {
      const name = document.getElementById('a-name').value.trim();
      if (!name) return;
      try {
        await api.patients.addAllergy(id, { name, severity: document.getElementById('a-sev').value, reaction: document.getElementById('a-reaction').value, notes: document.getElementById('a-notes').value });
        window.mdsToast('Allergy added', 'success');
        window.mdsNavigateTo('patient-detail', { id });
      } catch (err) { window.mdsToast(err.message, 'error'); }
    });

    document.getElementById('save-med-btn')?.addEventListener('click', async () => {
      const name = document.getElementById('m-name').value.trim();
      if (!name) return;
      try {
        await api.patients.addMedication(id, { name, dosage: document.getElementById('m-dosage').value, frequency: document.getElementById('m-freq').value });
        window.mdsToast('Medication added', 'success');
        window.mdsNavigateTo('patient-detail', { id });
      } catch (err) { window.mdsToast(err.message, 'error'); }
    });

    document.getElementById('save-diag-btn')?.addEventListener('click', async () => {
      const desc = document.getElementById('d-desc').value.trim();
      if (!desc) return;
      try {
        await api.patients.addDiagnosis(id, { description: desc, icd_code: document.getElementById('d-icd').value, diagnosed_at: document.getElementById('d-date').value });
        window.mdsToast('Diagnosis added', 'success');
        window.mdsNavigateTo('patient-detail', { id });
      } catch (err) { window.mdsToast(err.message, 'error'); }
    });

    // Close modal backdrops
    ['allergy-modal-backdrop','med-modal-backdrop','diag-modal-backdrop'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', e => { if (e.target.id === id) e.target.classList.remove('open'); });
    });

  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><i class="fas fa-exclamation-triangle"></i></div><h3>${err.message}</h3></div>`;
  }
}

function infoRow(icon, text) {
  return `<div style="display:flex;gap:8px;padding:7px 0;border-bottom:1px solid var(--border);font-size:13px">
    <span style="width:18px;text-align:center">${icon}</span>
    <span style="color:var(--text-secondary);word-break:break-all">${text}</span>
  </div>`;
}

function allergyModal(pid) {
  return `<div class="modal-backdrop" id="allergy-modal-backdrop">
    <div class="modal modal-sm">
      <div class="modal-header"><div class="modal-title"><i class="fas fa-exclamation-triangle"></i> Add Allergy</div><div class="modal-close" onclick="document.getElementById('allergy-modal-backdrop').classList.remove('open')"><i class="fas fa-times"></i></div></div>
      <div class="modal-body">
        <div class="form-group"><label class="form-label">Allergy Name *</label><input class="form-control" id="a-name" placeholder="e.g. Penicillin"></div>
        <div class="form-group"><label class="form-label">Severity</label>
          <select class="form-control form-select" id="a-sev"><option value="unknown">Unknown</option><option value="mild">Mild</option><option value="moderate">Moderate</option><option value="severe">Severe</option></select>
        </div>
        <div class="form-group"><label class="form-label">Reaction</label><input class="form-control" id="a-reaction" placeholder="Describe reaction…"></div>
        <div class="form-group"><label class="form-label">Notes</label><textarea class="form-control" id="a-notes" rows="2"></textarea></div>
      </div>
      <div class="modal-footer"><button class="btn btn-danger" id="save-allergy-btn">Add Allergy</button></div>
    </div>
  </div>`;
}

function medModal(pid) {
  return `<div class="modal-backdrop" id="med-modal-backdrop">
    <div class="modal modal-sm">
      <div class="modal-header"><div class="modal-title"><i class="fas fa-pills"></i> Add Medication</div><div class="modal-close" onclick="document.getElementById('med-modal-backdrop').classList.remove('open')"><i class="fas fa-times"></i></div></div>
      <div class="modal-body">
        <div class="form-group"><label class="form-label">Medication Name *</label><input class="form-control" id="m-name"></div>
        <div class="form-group"><label class="form-label">Dosage</label><input class="form-control" id="m-dosage" placeholder="e.g. 500mg"></div>
        <div class="form-group"><label class="form-label">Frequency</label><input class="form-control" id="m-freq" placeholder="e.g. twice daily"></div>
      </div>
      <div class="modal-footer"><button class="btn btn-primary" id="save-med-btn">Add Medication</button></div>
    </div>
  </div>`;
}

function diagModal(pid) {
  return `<div class="modal-backdrop" id="diag-modal-backdrop">
    <div class="modal modal-sm">
      <div class="modal-header"><div class="modal-title"><i class="fas fa-stethoscope"></i> Add Diagnosis</div><div class="modal-close" onclick="document.getElementById('diag-modal-backdrop').classList.remove('open')"><i class="fas fa-times"></i></div></div>
      <div class="modal-body">
        <div class="form-group"><label class="form-label">Description *</label><textarea class="form-control" id="d-desc" rows="2"></textarea></div>
        <div class="form-group"><label class="form-label">ICD Code</label><input class="form-control" id="d-icd" placeholder="e.g. K02.1"></div>
        <div class="form-group"><label class="form-label">Date</label><input class="form-control" type="date" id="d-date"></div>
      </div>
      <div class="modal-footer"><button class="btn btn-primary" id="save-diag-btn">Add Diagnosis</button></div>
    </div>
  </div>`;
}
