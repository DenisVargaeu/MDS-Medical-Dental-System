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
      renderDetailedPlan(plan);
    };

    window.managePlan = async (id) => {
      const plan = await api.treatmentPlans.get(id);
      renderDetailedPlan(plan, true);
    };

    function renderDetailedPlan(plan, isManagement = false) {
      const modal = document.createElement('div');
      modal.className = 'modal-backdrop open';
      modal.id = 'plan-detail-modal';
      
      // Calculate Progress
      const items = plan.items || [];
      const completed = items.filter(i => i.status === 'completed').length;
      const skipped = items.filter(i => i.status === 'skipped').length;
      const progress = items.length > 0 ? Math.round(((completed + skipped) / items.length) * 100) : 0;
      
      const totalCost = parseFloat(plan.total_estimated_cost || 0);
      const remainingCost = items.filter(i => i.status === 'pending').reduce((sum, i) => sum + parseFloat(i.treatment_price || 0), 0);

      // Group items by phase
      const phases = {};
      items.forEach(i => {
        if (!phases[i.phase_number]) phases[i.phase_number] = [];
        phases[i.phase_number].push(i);
      });

      modal.innerHTML = `
        <div class="modal modal-xl">
          <div class="modal-header">
            <div class="modal-title">
              <span class="badge badge-${plan.status === 'active' ? 'primary' : plan.status === 'completed' ? 'success' : 'muted'}" style="margin-right:8px">${plan.status.toUpperCase()}</span>
              ${plan.title}
            </div>
            <div class="modal-close" onclick="this.closest('.modal-backdrop').remove()"><i class="fas fa-times"></i></div>
          </div>
          <div class="modal-body" style="padding:0">
            <div class="tp-layout">
              <!-- Left Sidebar: Info & Stats -->
              <div class="tp-sidebar">
                <div class="patient-snippet mb-24">
                  <label class="tp-stat-label">Patient Information</label>
                  <div class="flex items-center gap-12">
                    <div class="avatar avatar-lg">${plan.patient_first_name[0]}${plan.patient_last_name[0]}</div>
                    <div>
                      <div style="font-weight:700;font-size:16px">${plan.patient_first_name} ${plan.patient_last_name}</div>
                      <div style="font-size:12px;color:var(--text-muted)">Dr. ${plan.doctor_surname}</div>
                    </div>
                  </div>
                </div>

                <div class="tp-progress-container">
                  <div class="flex justify-between mb-8">
                    <span class="tp-stat-label">Completion</span>
                    <span style="font-size:12px;font-weight:800">${progress}%</span>
                  </div>
                  <div class="tp-progress-track">
                    <div class="tp-progress-fill" style="width:${progress}%"></div>
                  </div>
                </div>

                <div class="tp-stat-widget">
                  <div class="tp-stat-label">Financial Overview</div>
                  <div class="flex justify-between mb-12">
                    <span style="font-size:13px;color:var(--text-secondary)">Total Estimate</span>
                    <span class="tp-stat-value">€${totalCost.toFixed(2)}</span>
                  </div>
                  <div class="flex justify-between">
                    <span style="font-size:13px;color:var(--text-secondary)">Remaining</span>
                    <span class="tp-stat-value" style="color:var(--primary)">€${remainingCost.toFixed(2)}</span>
                  </div>
                </div>

                ${plan.description ? `
                  <div class="mt-24">
                    <label class="tp-stat-label">Plan Description</label>
                    <p style="font-size:13px; line-height:1.6; color:var(--text-secondary)">${plan.description}</p>
                  </div>
                ` : ''}
                
                <div style="flex:1"></div>
                
                <div class="alert alert-info" style="margin-top:24px">
                  <i class="fas fa-info-circle alert-icon"></i>
                  <div>Statuses update real-time revenue projections.</div>
                </div>
              </div>

              <!-- Right: Detailed Phases -->
              <div class="tp-content">
                ${Object.keys(phases).sort().map(phaseNum => `
                  <div class="phase-section mb-32">
                    <div class="flex items-center gap-12 mb-24">
                      <div class="tp-phase-badge">${phaseNum}</div>
                      <h4 class="tp-phase-title">PHASE ${phaseNum}</h4>
                      <div style="flex:1; height:1px; background:var(--border)"></div>
                    </div>
                    <div class="flex flex-col gap-12">
                      ${phases[phaseNum].map(item => `
                        <div class="tp-item-card ${item.status}">
                          <div style="flex:1">
                            <div style="font-weight:700; color:var(--text-primary); font-size:14px; margin-bottom:4px">${item.treatment_name}</div>
                            <div style="font-size:11px; color:var(--text-muted); display:flex; gap:16px">
                              <span><i class="fas fa-tooth" style="margin-right:4px"></i> ${item.tooth_number ? `Tooth ${item.tooth_number}` : 'General'}</span>
                              ${item.notes ? `<span><i class="fas fa-sticky-note" style="margin-right:4px"></i> ${item.notes}</span>` : ''}
                            </div>
                          </div>
                          <div class="flex items-center gap-12">
                            <div style="font-size:13px; font-weight:800; color:var(--text-primary); margin-right:16px">€${parseFloat(item.treatment_price).toFixed(2)}</div>
                            <div class="flex items-center gap-4">
                              <span class="badge badge-${item.status==='completed'?'success':item.status==='skipped'?'muted':'warning'}">${item.status}</span>
                              ${item.status === 'completed' ? `
                                <i class="fas fa-coins" style="color:${item.payment_status === 'paid' ? 'var(--success)' : 'var(--text-muted)'}; font-size:12px" title="${item.payment_status === 'paid' ? 'Paid' : 'Unpaid'}"></i>
                              ` : ''}
                            </div>
                            ${isManagement && plan.status === 'active' ? `
                              <div class="flex gap-4 ml-8">
                                <button class="tp-action-btn success update-item-status" data-id="${item.id}" data-status="completed" title="Complete"><i class="fas fa-check"></i></button>
                                <button class="tp-action-btn update-item-status" data-id="${item.id}" data-status="skipped" title="Skip"><i class="fas fa-times"></i></button>
                                <button class="tp-action-btn update-item-status" data-id="${item.id}" data-status="pending" title="Reset"><i class="fas fa-undo"></i></button>
                              </div>
                            ` : ''}
                          </div>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
          <div class="modal-footer">
            ${isManagement ? `
              ${plan.status === 'draft' ? `<button class="btn btn-primary" id="activate-plan-btn"><i class="fas fa-play"></i> Activate Plan</button>` : ''}
              ${plan.status === 'active' ? `<button class="btn btn-success" id="complete-plan-btn"><i class="fas fa-flag-checkered"></i> Complete Full Plan</button>` : ''}
            ` : ''}
            <button class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove()">Close</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Status Handlers
      modal.querySelectorAll('.update-item-status').forEach(btn => {
        btn.onclick = async () => {
          const newStatus = btn.dataset.status;
          const itemId = btn.dataset.id;
          
          if (newStatus === 'completed') {
             // Show Payment Prompt instead of immediate update
             showPaymentPrompt(plan.id, itemId);
          } else {
            try {
              await api.treatmentPlans.updateItemStatus(plan.id, itemId, newStatus);
              modal.remove();
              await window.managePlan(plan.id);
              renderTreatmentPlans(container, params);
            } catch (err) { window.mdsToast(err.message, 'error'); }
          }
        };
      });

      function showPaymentPrompt(planId, itemId) {
        const prompt = document.createElement('div');
        prompt.className = 'modal-backdrop open';
        prompt.style.zIndex = '2000';
        prompt.innerHTML = `
          <div class="modal modal-sm animate-fade-in">
            <div class="modal-header">
              <div class="modal-title"><i class="fas fa-wallet text-primary"></i> Payment Choice</div>
            </div>
            <div class="modal-body text-center">
              <p style="font-size:14px; margin-bottom:20px">Treatment completed! Would you like to create an invoice <strong>now</strong> or add it to the <strong>final bill</strong>?</p>
              <div class="flex flex-col gap-8">
                <button class="btn btn-primary w-full" id="pay-now-btn"><i class="fas fa-file-invoice-dollar"></i> Pay Now (Platba teraz)</button>
                <button class="btn btn-secondary w-full" id="pay-later-btn"><i class="fas fa-clock"></i> Pay Later (Na konci)</button>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-ghost" onclick="this.closest('.modal-backdrop').remove()">Cancel</button>
            </div>
          </div>
        `;
        document.body.appendChild(prompt);

        prompt.querySelector('#pay-now-btn').onclick = async () => {
          try {
            await api.treatmentPlans.updateItemStatus(planId, itemId, 'completed', 'pay_now');
            window.mdsToast('Invoice generated successfully!', 'success');
            prompt.remove();
            modal.remove();
            await window.managePlan(planId);
            renderTreatmentPlans(container, params);
          } catch (err) { window.mdsToast(err.message, 'error'); }
        };

        prompt.querySelector('#pay-later-btn').onclick = async () => {
          try {
            await api.treatmentPlans.updateItemStatus(planId, itemId, 'completed', 'pay_later');
            prompt.remove();
            modal.remove();
            await window.managePlan(planId);
            renderTreatmentPlans(container, params);
          } catch (err) { window.mdsToast(err.message, 'error'); }
        };
      }

      document.getElementById('activate-plan-btn')?.addEventListener('click', async () => {
        try {
          await api.treatmentPlans.updateStatus(plan.id, 'active');
          modal.remove();
          await window.managePlan(plan.id);
          renderTreatmentPlans(container, params);
        } catch (err) { window.mdsToast(err.message, 'error'); }
      });

      document.getElementById('complete-plan-btn')?.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to mark this entire plan as COMPLETED?')) return;
        try {
          await api.treatmentPlans.updateStatus(plan.id, 'completed');
          modal.remove();
          await window.viewPlan(plan.id);
          renderTreatmentPlans(container, params);
        } catch (err) { window.mdsToast(err.message, 'error'); }
      });
    }
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><h3>Error: ${err.message}</h3></div>`;
  }
}
