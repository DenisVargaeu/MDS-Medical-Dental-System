import * as api from '../assets/js/api.js';

export async function renderTreatmentPlans(container, params = {}) {
  const patientId = params.patientId || null;
  
  try {
    const { data: plans } = await api.treatmentPlans.list({ patientId });
    const user = window.mdsCurrentUser();
    const isDoctor = user.role === 'doctor' || user.role === 'admin';
    const { data: allTreatments } = await api.treatments.list();

    container.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h2 class="page-title"><i class="fas fa-project-diagram"></i> Treatment Planning</h2>
          <p class="page-subtitle">${patientId ? 'Patient Treatment Roadmap' : 'All Active Treatment Plans'}</p>
        </div>
        ${isDoctor && patientId ? `<button class="btn btn-primary" id="new-plan-btn"><i class="fas fa-plus"></i> New Plan</button>` : ''}
      </div>

      <div class="card">
        <div class="table-wrapper">
          ${plans.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state-icon"><i class="fas fa-project-diagram"></i></div>
              <h3>No treatment plans found</h3>
              <p>Create a long-term plan with multiple treatments and phases.</p>
            </div>
          ` : `
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Estimated cost</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${plans.map(p => `
                  <tr>
                    <td><strong>${p.title}</strong></td>
                    <td><a href="#" onclick="mdsNavigateTo('patient-detail', {id: ${p.patient_id}})">${p.patient_first_name} ${p.patient_last_name}</a></td>
                    <td>Dr. ${p.doctor_name} ${p.doctor_surname}</td>
                    <td>€${parseFloat(p.total_estimated_cost).toFixed(2)}</td>
                    <td>${p.items.length} treatments</td>
                    <td><span class="badge badge-${p.status === 'active' ? 'primary' : p.status === 'completed' ? 'success' : 'muted'}">${p.status}</span></td>
                    <td>
                      <button class="btn btn-sm btn-ghost" onclick="viewPlan(${p.id})"><i class="fas fa-eye"></i></button>
                      ${isDoctor ? `<button class="btn btn-sm btn-ghost" onclick="managePlan(${p.id}, ${p.patient_id})"><i class="fas fa-edit"></i></button>` : ''}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>
      </div>

      <!-- Add Plan Modal -->
      <div class="modal-backdrop" id="plan-modal-backdrop">
        <div class="modal modal-lg">
          <div class="modal-header">
            <div class="modal-title">Create New Treatment Plan</div>
            <div class="modal-close" onclick="document.getElementById('plan-modal-backdrop').classList.remove('open')"><i class="fas fa-times"></i></div>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Plan Title *</label>
              <input type="text" class="form-control" id="plan-title" placeholder="e.g. Full Mouth Restoration">
            </div>
            <div class="form-group">
              <label class="form-label">Description (Optional)</label>
              <textarea class="form-control" id="plan-desc" rows="2"></textarea>
            </div>
            
            <h4 style="margin: 20px 0 10px; font-size: 14px;">Plan Items & Treatments</h4>
            <div id="plan-items-container">
              <div class="plan-item-row grid grid-12 gap-8" style="margin-bottom: 8px; align-items: end;">
                <div class="col-span-1"><label class="form-label">Phase</label><input type="number" class="form-control item-phase" value="1"></div>
                <div class="col-span-5">
                  <label class="form-label">Treatment</label>
                  <select class="form-control item-treatment">
                    <option value="">Select Treatment…</option>
                    ${allTreatments.map(t => `<option value="${t.id}">${t.name} (€${parseFloat(t.price).toFixed(2)})</option>`).join('')}
                  </select>
                </div>
                <div class="col-span-2"><label class="form-label">Tooth</label><input type="text" class="form-control item-tooth"></div>
                <div class="col-span-3"><label class="form-label">Notes</label><input type="text" class="form-control item-notes"></div>
                <div class="col-span-1"><button class="btn btn-ghost text-danger remove-item-btn"><i class="fas fa-trash"></i></button></div>
              </div>
            </div>
            <button class="btn btn-sm btn-secondary" id="add-item-row-btn" style="margin-top: 10px;"><i class="fas fa-plus"></i> Add Treatment</button>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="document.getElementById('plan-modal-backdrop').classList.remove('open')">Cancel</button>
            <button class="btn btn-primary" id="save-plan-btn">Save Treatment Plan</button>
          </div>
        </div>
      </div>
    `;

    // Handlers
    document.getElementById('new-plan-btn')?.addEventListener('click', () => {
      document.getElementById('plan-modal-backdrop').classList.add('open');
    });

    document.getElementById('add-item-row-btn')?.addEventListener('click', () => {
      const container = document.getElementById('plan-items-container');
      const row = document.createElement('div');
      row.className = 'plan-item-row grid grid-12 gap-8';
      row.style.marginBottom = '8px';
      row.style.alignItems = 'end';
      row.innerHTML = `
        <div class="col-span-1"><input type="number" class="form-control item-phase" value="1"></div>
        <div class="col-span-5">
          <select class="form-control item-treatment">
            <option value="">Select Treatment…</option>
            ${allTreatments.map(t => `<option value="${t.id}">${t.name} (€${parseFloat(t.price).toFixed(2)})</option>`).join('')}
          </select>
        </div>
        <div class="col-span-2"><input type="text" class="form-control item-tooth"></div>
        <div class="col-span-3"><input type="text" class="form-control item-notes"></div>
        <div class="col-span-1"><button class="btn btn-ghost text-danger remove-item-btn"><i class="fas fa-trash"></i></button></div>
      `;
      container.appendChild(row);
      row.querySelector('.remove-item-btn').onclick = () => row.remove();
    });

    document.querySelectorAll('.remove-item-btn').forEach(btn => {
      btn.onclick = () => btn.closest('.plan-item-row').remove();
    });

    document.getElementById('save-plan-btn')?.addEventListener('click', async () => {
      const title = document.getElementById('plan-title').value.trim();
      const description = document.getElementById('plan-desc').value.trim();
      
      const itemRows = document.querySelectorAll('.plan-item-row');
      const items = [];
      itemRows.forEach(row => {
        const treatment_id = row.querySelector('.item-treatment').value;
        if (treatment_id) {
          items.push({
            treatment_id,
            phase_number: row.querySelector('.item-phase').value || 1,
            tooth_number: row.querySelector('.item-tooth').value,
            notes: row.querySelector('.item-notes').value
          });
        }
      });

      if (!title || items.length === 0) return window.mdsToast('Title and at least one treatment item are required', 'error');

      try {
        await api.treatmentPlans.create({ patient_id: patientId, title, description, items });
        window.mdsToast('Treatment plan saved', 'success');
        renderTreatmentPlans(container, params);
      } catch (err) {
        window.mdsToast(err.message, 'error');
      }
    });

    window.viewPlan = async (id) => {
      const plan = await api.treatmentPlans.get(id);
      alert(`Treatment Plan: ${plan.title}\n\nPatient: ${plan.patient_first_name} ${plan.patient_last_name}\nDoctor: Dr. ${plan.doctor_name} ${plan.doctor_surname}\n\nItems:\n` + 
        plan.items.map(i => `Phase ${i.phase_number}: ${i.treatment_name} (${i.status})`).join('\n')
      );
    };

    window.managePlan = (id, pid) => {
       window.mdsToast('Detailed plan management coming soon in v1.2.0', 'info');
    };

  } catch (err) {
    container.innerHTML = `<div class="empty-state"><h3>Error: ${err.message}</h3></div>`;
  }
}
