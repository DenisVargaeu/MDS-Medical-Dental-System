import * as api from '../assets/js/api.js';
import { renderOdontogram } from './odontogram.js';

export async function renderClinicalSession(container, { patientId, appointmentId }) {
  if (!patientId || !appointmentId) {
    container.innerHTML = `<div class="empty-state"><h3>Invalid Session</h3><p>Patient and Appointment IDs are required.</p></div>`;
    return;
  }

  try {
    const { patient } = await api.patients.get(patientId);
    const appointment = await api.appointments.get(appointmentId);
    const treatments = (await api.treatments.list({ limit: 100 })).data || [];
    
    // State for the current session
    let sessionTreatments = [];
    let history = [];
    let status = appointment.status;
    let activeTab = 'chart'; // 'chart' | 'history'

    try {
      const hData = await api.records.list({ patient_id: patientId });
      history = hData.data || [];
    } catch (_) {}

    function render() {
      container.innerHTML = `
        <div class="page-header">
          <div class="page-title">
            <h2>Clinical Session: ${patient.first_name} ${patient.last_name}</h2>
            <p>Managing Appointment #${appointmentId} · Tooth Chart & Active Treatment</p>
          </div>
          <div style="display:flex;gap:12px">
            ${status === 'scheduled' || status === 'confirmed' ? 
              `<button class="btn btn-primary" id="start-session-btn"><i class="fas fa-play"></i> Start Treatment</button>` : ''}
            ${status === 'in_progress' ? 
              `<button class="btn btn-success" id="complete-session-btn"><i class="fas fa-check-double"></i> Complete & Generate Invoice</button>` : ''}
            <button class="btn btn-secondary" onclick="mdsNavigateTo('appointments')">Exit</button>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 350px;gap:24px">
          <!-- Left: Odontogram & Clinical Info -->
          <div style="display:flex;flex-direction:column;gap:24px">
            <div class="card" style="flex:1">
              <div class="card-header" style="padding:0">
                <div class="tabs" style="border:0">
                  <div class="tab ${activeTab==='chart'?'active':''}" id="tab-chart" style="flex:1;text-align:center"><i class="fas fa-tooth"></i> Dental Chart</div>
                  <div class="tab ${activeTab==='history'?'active':''}" id="tab-history" style="flex:1;text-align:center"><i class="fas fa-history"></i> History</div>
                </div>
              </div>
              <div class="card-body">
                <div id="tab-content-chart" style="display:${activeTab==='chart'?'block':'none'}">
                  <div id="session-odontogram-container"></div>
                </div>
                <div id="tab-content-history" style="display:${activeTab==='history'?'block':'none'}">
                  ${history.length === 0 ? 
                    `<div class="empty-state">No previous records found.</div>` : 
                    history.map(h => `
                      <div style="margin-bottom:16px;padding:12px;background:var(--bg-app);border-radius:8px">
                        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                          <strong>${new Date(h.visit_date).toLocaleDateString()}</strong>
                          <span class="badge badge-secondary">${h.chief_complaint || 'General'}</span>
                        </div>
                        <div style="font-size:13px;color:var(--text-muted)">${h.doctor_notes || 'No notes'}</div>
                      </div>
                    `).join('')}
                </div>
              </div>
            </div>
            
            <div class="card">
              <div class="card-header"><div class="card-title">Patient Medical Summary</div></div>
              <div class="card-body" style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
                <div><strong>Allergies:</strong> <span style="color:var(--danger)">${patient.warning_flags || 'None'}</span></div>
                <div><strong>Blood Type:</strong> ${patient.blood_type}</div>
                <div style="grid-column:1/-1"><strong>Notes:</strong> ${patient.notes || 'No clinical notes'}</div>
              </div>
            </div>
          </div>

          <!-- Right: Active Procedures -->
          <div style="display:flex;flex-direction:column;gap:24px">
            <div class="card" style="height:100%;min-height:500px;display:flex;flex-direction:column">
              <div class="card-header" style="justify-content:space-between">
                <div class="card-title">Active Procedures</div>
                <button class="btn btn-sm btn-primary" id="add-proc-btn" ${status !== 'in_progress' ? 'disabled' : ''}>
                  <i class="fas fa-plus"></i> Add
                </button>
              </div>
              <div class="card-body" style="flex:1;overflow-y:auto">
                ${status !== 'in_progress' ? 
                  `<div class="alert alert-info" style="margin-bottom:16px; font-size:13px">
                    <i class="fas fa-info-circle"></i> Click <strong>Start Treatment</strong> above to begin adding procedures.
                  </div>` : ''}
                <div id="session-proc-list">
                  ${treatments.length === 0 ?
                    `<div class="alert alert-warning" style="font-size:13px">
                      <i class="fas fa-exclamation-triangle"></i> No treatments found in system. Please add treatments in Settings first.
                    </div>` : ''}
                  ${sessionTreatments.length === 0 ? 
                    `<div style="text-align:center;padding:40px;color:var(--text-muted)">
                      <i class="fas fa-clipboard-list" style="font-size:32px;display:block;margin-bottom:8px"></i>
                      No procedures added yet
                    </div>` : 
                    sessionTreatments.map((t, idx) => `
                      <div style="padding:12px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
                        <div>
                          <div style="font-weight:600">${t.name}</div>
                          <div style="font-size:12px;color:var(--text-muted)">€${parseFloat(t.price).toFixed(2)}</div>
                        </div>
                        <button class="btn btn-icon btn-ghost remove-proc" data-idx="${idx}"><i class="fas fa-times"></i></button>
                      </div>
                    `).join('')}
                </div>
              </div>
              <div style="padding:16px;border-top:1px solid var(--border);background:var(--bg-app)">
                <div style="display:flex;justify-content:space-between;font-weight:700;font-size:16px">
                  <span>Total (Estimated)</span>
                  <span>€${sessionTreatments.reduce((acc, t) => acc + parseFloat(t.price), 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Add Procedure Modal -->
        <div class="modal-backdrop" id="proc-modal-backdrop">
          <div class="modal modal-sm">
            <div class="modal-header">
              <div class="modal-title">Select Treatment</div>
              <div class="modal-close" onclick="document.getElementById('proc-modal-backdrop').classList.remove('open')"><i class="fas fa-times"></i></div>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <select class="form-control form-select" id="proc-select">
                  <option value="">Choose treatment...</option>
                  ${treatments.map(t => `<option value="${t.id}" data-name="${t.name}" data-price="${t.price}">${t.name} (€${t.price})</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-primary" id="confirm-proc-btn">Add to Session</button>
            </div>
          </div>
        </div>
      `;

      if (activeTab === 'chart') {
        renderOdontogram(document.getElementById('session-odontogram-container'), patientId);
      }
      attachEvents();
    }

    function attachEvents() {
      document.getElementById('tab-chart').addEventListener('click', () => { activeTab = 'chart'; render(); });
      document.getElementById('tab-history').addEventListener('click', () => { activeTab = 'history'; render(); });
      document.getElementById('start-session-btn')?.addEventListener('click', async () => {
        try {
          await api.appointments.update(appointmentId, { status: 'in_progress' });
          status = 'in_progress';
          window.mdsToast('Clinical session started', 'success');
          render();
        } catch (err) { window.mdsToast(err.message, 'error'); }
      });

      document.getElementById('add-proc-btn')?.addEventListener('click', () => {
        document.getElementById('proc-modal-backdrop').classList.add('open');
      });

      document.getElementById('confirm-proc-btn')?.addEventListener('click', () => {
        const sel = document.getElementById('proc-select');
        if (sel.selectedIndex === -1) return;
        const opt = sel.options[sel.selectedIndex];
        if (!opt || !opt.value) return;
        sessionTreatments.push({ id: opt.value, name: opt.dataset.name, price: opt.dataset.price });
        document.getElementById('proc-modal-backdrop').classList.remove('open');
        render();
      });

      container.querySelectorAll('.remove-proc').forEach(btn => {
        btn.addEventListener('click', () => {
          sessionTreatments.splice(btn.dataset.idx, 1);
          render();
        });
      });

      document.getElementById('complete-session-btn')?.addEventListener('click', async () => {
        if (sessionTreatments.length === 0) {
          if (!confirm('No procedures recorded. Complete anyway?')) return;
        }

        const btn = document.getElementById('complete-session-btn');
        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Finalizing...`;

        try {
          // 1. Create medical record
          const record = await api.records.create({
            patient_id: patientId,
            doctor_id: window.mdsCurrentUser().id,
            visit_date: new Date().toISOString().split('T')[0],
            chief_complaint: appointment.type || 'Treatment Session',
            doctor_notes: 'Completed clinical session with automated invoicing.'
          });

          // 2. Add treatments to record
          for (const t of sessionTreatments) {
            await api.records.addTreatment(record.id, { treatment_id: t.id });
          }

          // 3. Create invoice
          await api.finance.createInvoice({
            patient_id: patientId,
            record_id: record.id,
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            notes: `Automated invoice from clinical session #${appointmentId}`
          });

          // 4. Complete appointment
          await api.appointments.update(appointmentId, { status: 'completed' });

          window.mdsToast('Session completed and invoice generated!', 'success');
          window.mdsNavigateTo('appointments');
        } catch (err) {
          window.mdsToast(err.message, 'error');
          btn.disabled = false;
          btn.innerHTML = `<i class="fas fa-check-double"></i> Complete & Generate Invoice`;
        }
      });
    }

    render();

  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">Error loading session: ${err.message}</div>`;
  }
}
