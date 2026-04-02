import * as api from '../assets/js/api.js';

export async function renderPatients(container, params = {}) {
  let currentPage = 1;
  let searchQuery = params.search || '';
  let totalPatients = 0;
  const limit = 20;

  container.innerHTML = `
  <div class="page-header">
    <div class="page-title"><h2>Patients</h2><p>Manage patient records and medical profiles</p></div>
    <button class="btn btn-primary" id="add-patient-btn"><i class="fas fa-user-plus"></i> Add Patient</button>
  </div>
  <div class="card">
    <div class="card-header" style="flex-wrap:wrap;gap:12px">
      <div class="search-bar" style="flex:1;min-width:200px">
        <span><i class="fas fa-search"></i></span>
        <input type="text" id="patient-search" placeholder="Search by name, phone, email, insurance…" value="${searchQuery}">
      </div>
      <div id="patients-count" style="color:var(--text-muted);font-size:13px"></div>
    </div>
    <div class="table-wrapper">
      <table>
        <thead><tr>
          <th>Patient</th><th>Age</th><th>Phone</th><th>Insurance</th>
          <th>Last Visit</th><th>Visits</th><th>Alerts</th><th>Actions</th>
        </tr></thead>
        <tbody id="patients-tbody"></tbody>
      </table>
    </div>
    <div style="padding:8px 16px" id="patients-pagination"></div>
  </div>
  ${patientModal()}`;

  await loadPatients();

  // Search
  let searchTimer;
  document.getElementById('patient-search').addEventListener('input', e => {
    clearTimeout(searchTimer);
    searchQuery = e.target.value;
    currentPage = 1;
    searchTimer = setTimeout(loadPatients, 350);
  });

  // Add Patient
  document.getElementById('add-patient-btn').addEventListener('click', () => openPatientModal());
  document.getElementById('patient-modal-backdrop').addEventListener('click', e => {
    if (e.target.id === 'patient-modal-backdrop') closePatientModal();
  });
  document.getElementById('patient-modal-close').addEventListener('click', closePatientModal);
  document.getElementById('patient-form').addEventListener('submit', submitPatientForm);

  async function loadPatients() {
    const tbody = document.getElementById('patients-tbody');
    tbody.innerHTML = `<tr><td colspan="8"><div class="loading-overlay"><div class="spinner"></div></div></td></tr>`;
    try {
      const data = await api.patients.list({ search: searchQuery, page: currentPage, limit });
      totalPatients = data.total;
      document.getElementById('patients-count').textContent = `${totalPatients} patient${totalPatients !== 1 ? 's' : ''}`;
      if (data.data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-state-icon"><i class="fas fa-users"></i></div><h3>No patients found</h3><p>Try a different search or add a new patient</p></div></td></tr>`;
        document.getElementById('patients-pagination').innerHTML = '';
        return;
      }
      tbody.innerHTML = data.data.map(p => `
        <tr style="cursor:pointer">
          <td onclick="mdsNavigateTo('patient-detail',{id:${p.id}})">
            <div style="display:flex;align-items:center;gap:10px">
              <div class="avatar avatar-sm">${p.first_name[0]}${p.last_name[0]}</div>
              <div>
                <div style="font-weight:600">${p.first_name} ${p.last_name}</div>
                <div style="font-size:11px;color:var(--text-muted)">${p.email || ''}</div>
              </div>
            </div>
          </td>
          <td onclick="mdsNavigateTo('patient-detail',{id:${p.id}})">${p.age ?? '—'}</td>
          <td onclick="mdsNavigateTo('patient-detail',{id:${p.id}})">${p.phone || '—'}</td>
          <td onclick="mdsNavigateTo('patient-detail',{id:${p.id}})">${p.insurance_number || '—'}</td>
          <td onclick="mdsNavigateTo('patient-detail',{id:${p.id}})">${p.last_visit ? new Date(p.last_visit).toLocaleDateString('sk-SK') : '—'}</td>
          <td onclick="mdsNavigateTo('patient-detail',{id:${p.id}})">${p.appointment_count}</td>
          <td onclick="mdsNavigateTo('patient-detail',{id:${p.id}})">${p.warning_flags ? `<span class="badge badge-danger"><i class="fas fa-exclamation-triangle"></i></span>` : '<span class="badge badge-success"><i class="fas fa-check"></i> Clear</span>'}</td>
          <td>
            <button class="btn btn-sm btn-secondary" onclick="mdsNavigateTo('patient-detail',{id:${p.id}})"><i class="fas fa-eye"></i> View</button>
            <button class="btn btn-sm btn-ghost edit-patient-btn" data-id="${p.id}" data-json='${JSON.stringify({first_name:p.first_name,last_name:p.last_name}).replace(/'/g,"&#39;")}'>Edit</button>
          </td>
        </tr>`).join('');

      // Edit buttons
      document.querySelectorAll('.edit-patient-btn').forEach(btn => {
        btn.addEventListener('click', () => openPatientModal(parseInt(btn.dataset.id)));
      });

      // Pagination
      const pages = Math.ceil(totalPatients / limit);
      document.getElementById('patients-pagination').innerHTML = `
        <div class="pagination">
          <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} id="prev-page">‹</button>
          <span style="font-size:13px;color:var(--text-muted);padding:0 8px">Page ${currentPage} of ${pages}</span>
          <button class="page-btn" ${currentPage >= pages ? 'disabled' : ''} id="next-page">›</button>
        </div>`;
      document.getElementById('prev-page')?.addEventListener('click', () => { currentPage--; loadPatients(); });
      document.getElementById('next-page')?.addEventListener('click', () => { currentPage++; loadPatients(); });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-state-icon"><i class="fas fa-exclamation-triangle"></i></div><h3>${err.message}</h3></div></td></tr>`;
    }
  }
}

function patientModal() {
  return `
  <div class="modal-backdrop" id="patient-modal-backdrop">
    <div class="modal modal-lg">
      <div class="modal-header">
        <div class="modal-title" id="patient-modal-title">Add Patient</div>
        <div class="modal-close" id="patient-modal-close"><i class="fas fa-times"></i></div>
      </div>
      <div class="modal-body">
        <form id="patient-form" novalidate>
          <input type="hidden" id="patient-id">
          <div class="form-grid form-grid-2">
            <div class="form-group"><label class="form-label">First Name *</label><input class="form-control" id="p-first-name" required></div>
            <div class="form-group"><label class="form-label">Last Name *</label><input class="form-control" id="p-last-name" required></div>
            <div class="form-group"><label class="form-label">Date of Birth</label><input class="form-control" type="date" id="p-birth-date"></div>
            <div class="form-group"><label class="form-label">Gender</label>
              <select class="form-control form-select" id="p-gender">
                <option value="">Select…</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
              </select>
            </div>
            <div class="form-group"><label class="form-label">Phone</label><input class="form-control" id="p-phone" type="tel"></div>
            <div class="form-group"><label class="form-label">Email</label><input class="form-control" id="p-email" type="email"></div>
            <div class="form-group"><label class="form-label">Insurance Number</label><input class="form-control" id="p-insurance"></div>
            <div class="form-group"><label class="form-label">Blood Type</label>
              <select class="form-control form-select" id="p-blood">
                ${['unknown','A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b=>`<option value="${b}">${b}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-group"><label class="form-label">Address</label><input class="form-control" id="p-address"></div>
          <div class="form-grid form-grid-3">
            <div class="form-group"><label class="form-label">City</label><input class="form-control" id="p-city"></div>
            <div class="form-group"><label class="form-label">Postal Code</label><input class="form-control" id="p-postal"></div>
            <div class="form-group"><label class="form-label">Country</label><input class="form-control" id="p-country" value="Slovakia"></div>
          </div>
          <div class="form-group"><label class="form-label"><i class="fas fa-exclamation-triangle"></i> Warning Flags / Allergy Alerts</label><textarea class="form-control" id="p-warnings" rows="2" placeholder="e.g. Severe penicillin allergy, latex allergy…"></textarea></div>
          <div class="form-group"><label class="form-label">Notes</label><textarea class="form-control" id="p-notes" rows="2"></textarea></div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="cancel-patient-btn">Cancel</button>
        <button class="btn btn-primary" id="save-patient-btn">Save Patient</button>
      </div>
    </div>
  </div>`;
}

let editingPatientId = null;

function openPatientModal(id = null) {
  editingPatientId = id;
  document.getElementById('patient-modal-title').textContent = id ? 'Edit Patient' : 'Add New Patient';
  if (!id) {
    ['first-name','last-name','birth-date','phone','email','insurance','address','city','postal','warnings','notes'].forEach(k => {
      const el = document.getElementById(`p-${k}`);
      if (el) el.value = '';
    });
    document.getElementById('p-gender').value = '';
    document.getElementById('p-blood').value = 'unknown';
    document.getElementById('p-country').value = 'Slovakia';
  }
  document.getElementById('patient-modal-backdrop').classList.add('open');
  document.getElementById('p-first-name').focus();
  document.getElementById('cancel-patient-btn').onclick = closePatientModal;
  document.getElementById('save-patient-btn').onclick = submitPatientForm;
}

function closePatientModal() {
  document.getElementById('patient-modal-backdrop').classList.remove('open');
}

async function submitPatientForm(e) {
  e.preventDefault && e.preventDefault();
  const btn = document.getElementById('save-patient-btn');
  const first_name = document.getElementById('p-first-name').value.trim();
  const last_name = document.getElementById('p-last-name').value.trim();
  if (!first_name || !last_name) { window.mdsToast('First name and last name are required', 'error'); return; }

  const data = {
    first_name, last_name,
    birth_date: document.getElementById('p-birth-date').value || null,
    gender: document.getElementById('p-gender').value || null,
    phone: document.getElementById('p-phone').value || null,
    email: document.getElementById('p-email').value || null,
    insurance_number: document.getElementById('p-insurance').value || null,
    blood_type: document.getElementById('p-blood').value || 'unknown',
    address: document.getElementById('p-address').value || null,
    city: document.getElementById('p-city').value || null,
    postal_code: document.getElementById('p-postal').value || null,
    country: document.getElementById('p-country').value || 'Slovakia',
    warning_flags: document.getElementById('p-warnings').value || null,
    notes: document.getElementById('p-notes').value || null,
  };

  btn.textContent = 'Saving…';
  btn.disabled = true;
  try {
    if (editingPatientId) {
      await api.patients.update(editingPatientId, data);
      window.mdsToast('Patient updated successfully', 'success');
    } else {
      const created = await api.patients.create(data);
      window.mdsToast('Patient created', 'success');
      closePatientModal();
      window.mdsNavigateTo('patient-detail', { id: created.id });
      return;
    }
    closePatientModal();
    window.mdsNavigateTo('patients');
  } catch (err) {
    window.mdsToast(err.message, 'error');
  } finally {
    btn.textContent = 'Save Patient';
    btn.disabled = false;
  }
}
