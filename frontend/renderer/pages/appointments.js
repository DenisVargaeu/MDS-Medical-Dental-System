import * as api from '../assets/js/api.js';

export async function renderAppointments(container, params = {}) {
  let doctors = [];
  let treatments = [];
  let viewMode = 'list'; // 'list' | 'calendar'
  let filterDate = new Date().toISOString().split('T')[0];

  try { 
    doctors = await api.users.doctors(); 
    const tData = await api.treatments.list({ limit: 100 });
    treatments = tData.data || [];
  } catch (_) {}

  const user = window.mdsCurrentUser();
  const isDoctor = user.role === 'doctor' || user.role === 'admin';

  container.innerHTML = `
  <div class="page-header">
    <div class="page-title"><h2>Appointments</h2><p>Schedule and manage patient appointments</p></div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-secondary ${viewMode==='list'?'btn-primary':''}" id="view-list"><i class="fas fa-list"></i> List</button>
      <button class="btn btn-secondary" id="view-cal"><i class="fas fa-calendar-alt"></i> Calendar</button>
      <button class="btn btn-primary" id="new-appt-btn"><i class="fas fa-plus"></i> New Appointment</button>
    </div>
  </div>

  <div class="card" style="margin-bottom:16px">
    <div class="card-header" style="flex-wrap:wrap;gap:10px">
      <div style="display:flex;align-items:center;gap:8px">
        <label class="form-label" style="margin:0;white-space:nowrap">Date</label>
        <input type="date" class="form-control" id="filter-date" value="${filterDate}" style="width:160px">
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <label class="form-label" style="margin:0">Doctor</label>
        <select class="form-control form-select" id="filter-doctor" style="width:180px">
          <option value="">All Doctors</option>
          ${doctors.map(d => `<option value="${d.id}">Dr. ${d.name} ${d.surname}</option>`).join('')}
        </select>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <label class="form-label" style="margin:0">Status</label>
        <select class="form-control form-select" id="filter-status" style="width:150px">
          <option value="">All</option>
          ${['scheduled','confirmed','in_progress','completed','cancelled','no_show'].map(s => `<option value="${s}">${s}</option>`).join('')}
        </select>
      </div>
      <button class="btn btn-secondary" id="load-appts-btn">Filter</button>
    </div>
  </div>

  <div id="appts-container"></div>
  ${appointmentModal(doctors, treatments, params.patientId)}
  ${treatmentModal(treatments)}
  `;

  await loadAppointments();

  document.getElementById('new-appt-btn').addEventListener('click', () => openApptModal());
  document.getElementById('view-list').addEventListener('click', () => { viewMode = 'list'; renderActiveView(); });
  document.getElementById('view-cal').addEventListener('click', () => { viewMode = 'calendar'; renderActiveView(); });
  
  // Auto-fill duration on treatment type change
  container.addEventListener('change', e => {
    if (e.target.id === 'appt-type-select') {
      const opt = e.target.options[e.target.selectedIndex];
      const duration = opt.dataset.duration || 30;
      document.getElementById('appt-duration').value = duration;
    }
  });

  document.getElementById('appt-modal-backdrop').addEventListener('click', e => { if (e.target.id === 'appt-modal-backdrop') closeApptModal(); });
  document.getElementById('appt-modal-close').addEventListener('click', closeApptModal);
  document.getElementById('save-appt-btn').addEventListener('click', saveAppt);
  document.getElementById('load-appts-btn').addEventListener('click', loadAppointments);
  document.getElementById('filter-date').addEventListener('change', e => { filterDate = e.target.value; loadAppointments(); });
  document.getElementById('filter-doctor').addEventListener('change', loadAppointments);
  document.getElementById('filter-status').addEventListener('change', loadAppointments);
  
  async function renderActiveView() {
    const btnList = document.getElementById('view-list');
    const btnCal = document.getElementById('view-cal');
    btnList.className = `btn btn-secondary ${viewMode==='list'?'btn-primary':''}`;
    btnCal.className = `btn btn-secondary ${viewMode==='calendar'?'btn-primary':''}`;
    
    if (viewMode === 'calendar') {
      renderCalendar(document.getElementById('appts-container'));
    } else {
      loadAppointments();
    }
  }

  async function renderCalendar(calContainer) {
    calContainer.innerHTML = `<div class="card" style="padding:40px;text-align:center"><div style="font-size:48px;color:var(--primary-ghost);margin-bottom:16px"><i class="fas fa-calendar-alt"></i></div><h3>Weekly Calendar View</h3><p>Visual scheduling grid coming in the next update. Using List view for now.</p><button class="btn btn-secondary" onclick="document.getElementById('view-list').click()">Back to List</button></div>`;
  }

  async function loadAppointments() {
    const apptContainer = document.getElementById('appts-container');
    apptContainer.innerHTML = `<div class="loading-overlay"><div class="spinner"></div></div>`;
    const queryParams = {};
    const date = document.getElementById('filter-date').value;
    const doctor = document.getElementById('filter-doctor').value;
    const status = document.getElementById('filter-status').value;
    if (date) queryParams.date = date;
    if (doctor) queryParams.doctor_id = doctor;
    if (status) queryParams.status = status;
    if (params.patientId) queryParams.patient_id = params.patientId;

    try {
      const data = await api.appointments.list(queryParams);
      const appts = data.data;
      const statusColors = { scheduled:'badge-primary', confirmed:'badge-info', in_progress:'badge-warning', completed:'badge-success', cancelled:'badge-muted', no_show:'badge-danger' };

      if (appts.length === 0) {
        apptContainer.innerHTML = `<div class="card"><div class="empty-state"><div class="empty-state-icon"><i class="fas fa-calendar"></i></div><h3>No appointments found</h3><p>Try different filters or create a new appointment</p></div></div>`;
        return;
      }

      apptContainer.innerHTML = `
      <div class="card">
        <div class="table-wrapper">
          <table>
            <thead><tr><th>Date</th><th>Time</th><th>Duration</th><th>Patient</th><th>Doctor</th><th>Type</th><th>Status</th><th>Alerts</th><th>Actions</th></tr></thead>
            <tbody>
              ${appts.map(a => `<tr>
                <td><strong>${new Date(a.date+'T00:00:00').toLocaleDateString('sk-SK', {weekday:'short',month:'short',day:'numeric'})}</strong></td>
                <td style="font-family:monospace;font-weight:600">${a.time?.slice(0,5)}</td>
                <td style="color:var(--text-muted)">${a.duration_minutes}min</td>
                <td>
                  <div style="display:flex;align-items:center;gap:8px">
                    <div class="avatar avatar-sm">${a.first_name[0]}${a.last_name[0]}</div>
                    <span style="cursor:pointer;color:var(--primary);font-weight:500" onclick="mdsNavigateTo('patient-detail',{id:${a.patient_id}})">${a.first_name} ${a.last_name}</span>
                  </div>
                </td>
                <td>Dr. ${a.doctor_name} ${a.doctor_surname}</td>
                <td>${a.type || '—'}</td>
                <td><span class="badge ${statusColors[a.status]||'badge-muted'}" style="margin-bottom:4px">${a.status}</span>
                  <select class="form-control form-select btn-sm appt-status-select" data-id="${a.id}" style="padding:2px 4px;font-size:10px">
                    ${['scheduled','confirmed','in_progress','completed','cancelled','no_show'].map(s => `<option value="${s}" ${a.status===s?'selected':''}>${s}</option>`).join('')}
                  </select>
                </td>
                <td>${a.warning_flags ? `<span class="badge badge-danger" title="${a.warning_flags}"><i class="fas fa-exclamation-triangle"></i></span>` : ''}</td>
                <td>
                  <div style="display:flex;gap:4px">
                    ${isDoctor ? `<button class="btn btn-sm ${a.status==='completed'?'btn-secondary':'btn-success'} open-session-btn" data-id="${a.id}" data-patient-id="${a.patient_id}" title="Clinical Session"><i class="fas fa-microscope"></i> Session</button>` : ''}
                    <button class="btn btn-sm btn-secondary edit-appt" data-id="${a.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger cancel-appt" data-id="${a.id}" ${a.status==='cancelled'?'disabled':''}><i class="fas fa-times"></i></button>
                  </div>
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;

      document.querySelectorAll('.cancel-appt').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Cancel this appointment?')) return;
          try { await api.appointments.cancel(parseInt(btn.dataset.id)); window.mdsToast('Appointment cancelled', 'success'); loadAppointments(); }
          catch (err) { window.mdsToast(err.message, 'error'); }
        });
      });
    } catch (err) {
      apptContainer.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><i class="fas fa-exclamation-triangle"></i></div><h3>${err.message}</h3></div>`;
    }
  }

  async function saveAppt() {
    const btn = document.getElementById('save-appt-btn');
    btn.textContent = 'Saving…'; btn.disabled = true;
    try {
      const data = {
        patient_id: document.getElementById('appt-patient-id').value,
        doctor_id: document.getElementById('appt-doctor').value,
        date: document.getElementById('appt-date').value,
        time: document.getElementById('appt-time').value,
        duration_minutes: document.getElementById('appt-duration').value || 30,
        type: document.getElementById('appt-type-select').value,
        notes: document.getElementById('appt-notes').value,
      };
      if (!data.patient_id || !data.doctor_id || !data.date || !data.time) {
        window.mdsToast('Patient, doctor, date and time are required', 'error'); return;
      }
      await api.appointments.create(data);
      window.mdsToast('Appointment created', 'success');
      closeApptModal();
      loadAppointments();
    } catch (err) { window.mdsToast(err.message, 'error'); }
    finally { btn.textContent = 'Save'; btn.disabled = false; }
  }

  // Handle clinical session button
  container.addEventListener('click', async e => {
    const btn = e.target.closest('.open-session-btn');
    if (!btn) return;
    const { id, patientId } = btn.dataset;
    window.mdsNavigateTo('clinical-session', { appointmentId: id, patientId });
  });

  // Handle status changes in table
  container.addEventListener('change', async e => {
    if (e.target.classList.contains('appt-status-select')) {
      const id = e.target.dataset.id;
      const status = e.target.value;
      try {
        await api.appointments.update(id, { status });
        window.mdsToast('Status updated', 'success');
        loadAppointments();
      } catch (err) { window.mdsToast(err.message, 'error'); }
    }
  });

  document.getElementById('save-treatment-btn').addEventListener('click', saveQuickTreatment);
}

function openTreatmentModal(apptId, patientId) {
  document.getElementById('treat-appt-id').value = apptId;
  document.getElementById('treat-patient-id').value = patientId;
  document.getElementById('treatment-modal-backdrop').classList.add('open');
}

function closeTreatmentModal() {
  document.getElementById('treatment-modal-backdrop').classList.remove('open');
}

async function saveQuickTreatment() {
  const apptId = document.getElementById('treat-appt-id').value;
  const patientId = document.getElementById('treat-patient-id').value;
  const treatmentId = document.getElementById('treat-select').value;
  const notes = document.getElementById('treat-notes').value;

  if (!treatmentId) return window.mdsToast('Please select a treatment', 'warning');

  const btn = document.getElementById('save-treatment-btn');
  btn.disabled = true;
  try {
    // 1. Ensure a medical record exists for today
    const records = await api.records.list({ patient_id: patientId, date: new Date().toISOString().split('T')[0] });
    let recordId;
    if (records.data && records.data.length > 0) {
      recordId = records.data[0].id;
    } else {
      const newRec = await api.records.create({
        patient_id: patientId,
        doctor_id: window.mdsCurrentUser().id,
        visit_date: new Date().toISOString().split('T')[0],
        chief_complaint: 'Appointment Treatment',
        doctor_notes: 'Quick treatment recorded from appointment view'
      });
      recordId = newRec.id;
    }

    // 2. Add treatment to record
    await api.records.addTreatment(recordId, { treatment_id: treatmentId, notes });
    
    // 3. Mark appointment as completed
    await api.appointments.update(apptId, { status: 'completed' });

    window.mdsToast('Treatment recorded and appointment completed', 'success');
    closeTreatmentModal();
    window.mdsNavigateTo('appointments');
  } catch (err) { window.mdsToast(err.message, 'error'); }
  finally { btn.disabled = false; }
}

function treatmentModal(treatments) {
  return `
    <div class="modal-backdrop" id="treatment-modal-backdrop">
      <div class="modal modal-sm">
        <div class="modal-header">
          <div class="modal-title"><i class="fas fa-stethoscope"></i> Quick Treatment</div>
          <div class="modal-close" onclick="document.getElementById('treatment-modal-backdrop').classList.remove('open')"><i class="fas fa-times"></i></div>
        </div>
        <div class="modal-body">
          <input type="hidden" id="treat-appt-id">
          <input type="hidden" id="treat-patient-id">
          <div class="form-group">
            <label class="form-label">Select Treatment</label>
            <select class="form-control form-select" id="treat-select">
              <option value="">Select treatment…</option>
              ${treatments.map(t => `<option value="${t.id}">${t.name} (€${t.price})</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Clinical Notes</label>
            <textarea class="form-control" id="treat-notes" rows="3"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" id="save-treatment-btn">Apply & Complete</button>
        </div>
      </div>
    </div>
  `;
}

function openApptModal() { document.getElementById('appt-modal-backdrop').classList.add('open'); }
function closeApptModal() { document.getElementById('appt-modal-backdrop').classList.remove('open'); }

function appointmentModal(doctors, treatments, prefilledPatientId = null) {
  const today = new Date().toISOString().split('T')[0];
  return `
  <div class="modal-backdrop" id="appt-modal-backdrop">
    <div class="modal modal-md">
      <div class="modal-header"><div class="modal-title"><i class="fas fa-calendar-plus"></i> New Appointment</div><div class="modal-close" id="appt-modal-close" onclick="document.getElementById('appt-modal-backdrop').classList.remove('open')"><i class="fas fa-times"></i></div></div>
      <div class="modal-body">
        <div class="alert alert-info" style="font-size:12px"><span class="alert-icon"><i class="fas fa-info-circle"></i></span> Enter patient ID and select a treatment procedure from the list.</div>
        <div class="form-grid form-grid-2" style="margin-top:16px">
          <div class="form-group"><label class="form-label">Patient ID *</label><input class="form-control" id="appt-patient-id" type="number" value="${prefilledPatientId || ''}"></div>
          <div class="form-group"><label class="form-label">Doctor *</label>
            <select class="form-control form-select" id="appt-doctor">
              <option value="">Select doctor…</option>
              ${doctors.map(d => `<option value="${d.id}">Dr. ${d.name} ${d.surname}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label class="form-label">Type / Procedure *</label>
            <select class="form-control form-select" id="appt-type-select">
              <option value="">Select type…</option>
              <optgroup label="Common Procedures">
                ${treatments.map(t => `<option value="${t.name}" data-duration="${t.duration_minutes}">${t.name}</option>`).join('')}
              </optgroup>
              <option value="Consultation">General Consultation</option>
              <option value="Follow-up">Follow-up Visit</option>
              <option value="Other">Other...</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">Duration (min)</label><input class="form-control" type="number" id="appt-duration" value="30" min="5" max="480"></div>
          <div class="form-group"><label class="form-label">Date *</label><input class="form-control" type="date" id="appt-date" value="${today}"></div>
          <div class="form-group"><label class="form-label">Time *</label><input class="form-control" type="time" id="appt-time" value="09:00"></div>
        </div>
        <div class="form-group"><label class="form-label">Notes</label><textarea class="form-control" id="appt-notes" rows="2" placeholder="Symptom details or specific requests..."></textarea></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('appt-modal-backdrop').classList.remove('open')">Cancel</button>
        <button class="btn btn-primary" id="save-appt-btn">Create Appointment</button>
      </div>
    </div>
  </div>`;
}
