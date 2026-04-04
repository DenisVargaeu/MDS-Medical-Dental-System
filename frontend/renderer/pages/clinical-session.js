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
    let activeTab = 'chart'; 
    let startTime = status === 'in_progress' ? Date.now() : null;

    try {
      const hData = await api.records.list({ patient_id: patientId });
      history = hData.data || [];
    } catch (_) {}

    function render() {
      container.innerHTML = `
        <div class="session-header-premium">
          <div class="session-patient-block">
            <div class="avatar avatar-lg" style="width:56px; height:56px; font-size:20px">${(patient.first_name || 'P')[0]}${(patient.last_name || '')[0] || ''}</div>
            <div class="session-info">
              <h1>${patient.first_name || 'Patient'} ${patient.last_name || ''}</h1>
              <div class="session-meta">
                <span class="badge badge-pill ${status==='in_progress'?'badge-warning':'badge-primary'}">${status.toUpperCase()}</span>
                <span class="meta-item"><i class="fas fa-fingerprint"></i> ID: #${patientId}</span>
                <span class="meta-item"><i class="fas fa-calendar-check"></i> Appt: #${appointmentId}</span>
              </div>
            </div>
          </div>

          <div class="session-timer-block">
            <div class="timer-display" id="session-timer">${startTime ? formatDuration(Date.now() - startTime) : '00:00:00'}</div>
            <div class="timer-label">Session Elapsed</div>
          </div>

          <div class="session-actions">
            ${status === 'scheduled' || status === 'confirmed' ? 
              `<button class="btn btn-primary shadow-sm" id="start-session-btn"><i class="fas fa-play"></i> START SESSION</button>` : ''}
            ${status === 'in_progress' ? 
              `<button class="btn btn-success shadow-lg" id="complete-session-btn"><i class="fas fa-check-circle"></i> COMPLETE & INVOICE</button>` : ''}
            <button class="btn btn-ghost" onclick="mdsNavigateTo('appointments')"><i class="fas fa-times"></i> EXIT</button>
          </div>
        </div>

        <div class="clinical-bento-grid">
          <!-- Main Work Area (Tabs) -->
          <div class="bento-col main-panel card">
            <div class="tabs-header">
              <button class="tab-trigger ${activeTab==='chart'?'active':''}" id="tab-chart">
                <i class="fas fa-tooth"></i> <span>Dental Chart</span>
              </button>
              <button class="tab-trigger ${activeTab==='history'?'active':''}" id="tab-history">
                <i class="fas fa-book-medical"></i> <span>History</span>
              </button>
            </div>
            <div class="panel-body">
              <div id="tab-content-chart" style="display:${activeTab==='chart'?'block':'none'}">
                <div id="session-odontogram-container" style="transform: scale(0.95); transform-origin: top center;"></div>
              </div>
              <div id="tab-content-history" style="display:${activeTab==='history'?'block':'none'}">
                ${history.length === 0 ? 
                  `<div class="empty-placeholder"><i class="fas fa-folder-open"></i><p>No historical records for this patient.</p></div>` : 
                  history.map(h => `
                    <div class="history-item">
                      <div class="history-date">${new Date(h.visit_date).toLocaleDateString('sk-SK', {day:'numeric', month:'short', year:'numeric'})}</div>
                      <div class="history-content">
                        <div class="history-title">${h.chief_complaint || 'General Session'}</div>
                        <div class="history-notes">${h.doctor_notes || 'No doctor notes provided.'}</div>
                      </div>
                    </div>
                  `).join('')}
              </div>
            </div>
          </div>

          <!-- Side Panel: Stats & Procedures -->
          <div class="bento-col side-panel">
            <!-- Medical Alerts -->
            <div class="card alert-card ${patient.warning_flags ? 'critical' : 'stable'}">
              <div class="card-header"><div class="card-title"><i class="fas fa-exclamation-triangle"></i> Medical Alerts</div></div>
              <div class="card-body">
                <div class="alert-item"><strong>Allergies:</strong> <span>${patient.warning_flags || 'NIC'}</span></div>
                <div class="alert-item"><strong>Blood Type:</strong> <span>${patient.blood_type || '—'}</span></div>
              </div>
            </div>

            <!-- Active Procedures Cart -->
            <div class="card procedure-cart">
              <div class="card-header">
                <div class="card-title"><i class="fas fa-layer-group"></i> Active Procedures</div>
                <button class="btn btn-sm btn-primary-ghost" id="add-proc-btn" ${status !== 'in_progress' ? 'disabled' : ''}>
                  <i class="fas fa-plus"></i> Add
                </button>
              </div>
              <div class="cart-body" id="session-proc-list">
                ${sessionTreatments.length === 0 ? 
                  `<div class="empty-cart"><i class="fas fa-shopping-cart"></i><p>No procedures logged yet.</p></div>` : 
                  sessionTreatments.map((t, idx) => `
                    <div class="cart-item">
                      <div class="item-info">
                        <div class="item-name">${t.name}</div>
                        <div class="item-price">€${parseFloat(t.price).toFixed(2)}</div>
                      </div>
                      <button class="remove-btn remove-proc" data-idx="${idx}"><i class="fas fa-trash-alt"></i></button>
                    </div>
                  `).join('')}
              </div>
              <div class="cart-footer">
                <div class="total-row">
                  <span>Subtotal</span>
                  <span>€${sessionTreatments.reduce((acc, t) => acc + parseFloat(t.price), 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Treatment Picker Modal -->
        <div class="modal-backdrop" id="proc-modal-backdrop">
          <div class="modal modal-sm">
            <div class="modal-header">
              <div class="modal-title">Select Treatment</div>
              <div class="modal-close" onclick="document.getElementById('proc-modal-backdrop').classList.remove('open')"><i class="fas fa-times"></i></div>
            </div>
            <div class="modal-body">
              <select class="form-control form-select" id="proc-select">
                <option value="">Choose procedure...</option>
                ${treatments.map(t => `<option value="${t.id}" data-name="${t.name}" data-price="${t.price}">${t.name} (€${t.price})</option>`).join('')}
              </select>
            </div>
            <div class="modal-footer">
              <button class="btn btn-primary w-100" id="confirm-proc-btn">Add to Record</button>
            </div>
          </div>
        </div>

        <style>
          .session-header-premium { display: flex; align-items: center; justify-content: space-between; background: var(--bg-card); border-radius: 24px; padding: 24px; margin-bottom: 32px; border: 1px solid var(--border); box-shadow: var(--shadow-md); }
          .session-patient-block { display: flex; align-items: center; gap: 20px; }
          .session-info h1 { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
          .session-meta { display: flex; gap: 12px; margin-top: 8px; font-size: 13px; color: var(--text-muted); font-weight: 600; }
          .meta-item { display: flex; align-items: center; gap: 4px; }
          
          .session-timer-block { text-align: center; }
          .timer-display { font-family: var(--font-mono); font-size: 32px; font-weight: 700; color: var(--primary); letter-spacing: 2px; }
          .timer-label { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-top: 2px; }

          .clinical-bento-grid { display: grid; grid-template-columns: 1fr 380px; gap: 32px; }
          .main-panel { background: var(--bg-card); display: flex; flex-direction: column; overflow: hidden; border-radius: 24px; }
          .tabs-header { display: flex; border-bottom: 1px solid var(--border); background: var(--bg-app); }
          .tab-trigger { flex: 1; padding: 16px; border: none; background: transparent; font-size: 14px; font-weight: 700; color: var(--text-muted); cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 10px; }
          .tab-trigger.active { color: var(--primary); background: var(--bg-card); box-shadow: inset 0 -3px 0 var(--primary); }
          .tab-trigger:hover:not(.active) { background: rgba(0,0,0,0.05); }

          .panel-body { padding: 32px; flex: 1; overflow-y: auto; max-height: 700px; }
          
          .history-item { display: flex; gap: 20px; margin-bottom: 24px; }
          .history-date { font-size: 12px; font-weight: 800; color: var(--primary); background: var(--primary-ghost); padding: 4px 12px; height: fit-content; border-radius: 8px; white-space: nowrap; }
          .history-title { font-weight: 700; font-size: 15px; margin-bottom: 4px; }
          .history-notes { font-size: 13px; color: var(--text-secondary); line-height: 1.5; }

          .alert-card.critical { background: #fee2e2; border-color: #fecaca; }
          .alert-card.critical .card-title { color: #dc2626; }
          .alert-item { font-size: 14px; margin-bottom: 8px; }
          .alert-item span { font-weight: 700; }

          .procedure-cart { min-height: 400px; display: flex; flex-direction: column; border-radius: 24px; }
          .cart-body { padding: 16px; flex: 1; overflow-y: auto; }
          .empty-cart { text-align: center; padding: 60px 20px; color: var(--text-muted); opacity: 0.5; }
          .empty-cart i { font-size: 40px; margin-bottom: 12px; }
          .cart-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--bg-app); border-radius: 12px; margin-bottom: 8px; border: 1px solid var(--border); }
          .item-name { font-size: 14px; font-weight: 600; }
          .item-price { font-size: 12px; color: var(--text-muted); font-weight: 600; }
          .remove-btn { color: var(--text-muted); background: transparent; padding: 8px; transition: color 0.2s; }
          .remove-btn:hover { color: var(--danger); }

          .cart-footer { padding: 20px; border-top: 1px solid var(--border); background: var(--bg-app); border-radius: 0 0 24px 24px; }
          .total-row { display: flex; justify-content: space-between; font-size: 18px; font-weight: 800; color: var(--text-primary); }
        </style>
      `;

      if (activeTab === 'chart') {
        renderOdontogram(document.getElementById('session-odontogram-container'), patientId);
      }
      attachEvents();
    }

    function formatDuration(ms) {
      const s = Math.floor(ms / 1000) % 60;
      const m = Math.floor(ms / 60000) % 60;
      const h = Math.floor(ms / 3600000);
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    function attachEvents() {
      // Timer update
      if (startTime) {
        const timerEl = document.getElementById('session-timer');
        const interval = setInterval(() => {
          if (!timerEl) return clearInterval(interval);
          timerEl.textContent = formatDuration(Date.now() - startTime);
        }, 1000);
      }

      document.getElementById('tab-chart').addEventListener('click', () => { activeTab = 'chart'; render(); });
      document.getElementById('tab-history').addEventListener('click', () => { activeTab = 'history'; render(); });
      
      document.getElementById('start-session-btn')?.addEventListener('click', async () => {
        try {
          await api.appointments.update(appointmentId, { status: 'in_progress' });
          status = 'in_progress';
          startTime = Date.now();
          window.mdsToast('Clinical session started', 'success');
          render();
        } catch (err) { window.mdsToast(err.message, 'error'); }
      });

      document.getElementById('add-proc-btn')?.addEventListener('click', () => {
        document.getElementById('proc-modal-backdrop').classList.add('open');
      });

      document.getElementById('confirm-proc-btn')?.addEventListener('click', () => {
        const sel = document.getElementById('proc-select');
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
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> FINALIZING...`;

        try {
          const record = await api.records.create({
            patient_id: patientId,
            doctor_id: window.mdsCurrentUser().id,
            visit_date: new Date().toISOString().split('T')[0],
            chief_complaint: appointment.type || 'Treatment Session',
            doctor_notes: `Clinical session completed in ${document.getElementById('session-timer').textContent}.`
          });

          for (const t of sessionTreatments) {
            await api.records.addTreatment(record.id, { treatment_id: t.id, unit_price: t.price });
          }

          await api.finance.createInvoice({
            patient_id: patientId,
            record_id: record.id,
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            notes: `Automated invoice for clinical session #${appointmentId}`
          });

          await api.appointments.update(appointmentId, { status: 'completed' });
          window.mdsToast('Session completed successfully!', 'success');
          window.mdsNavigateTo('appointments');
        } catch (err) {
          window.mdsToast(err.message, 'error');
          btn.disabled = false;
          btn.innerHTML = `<i class="fas fa-check-circle"></i> COMPLETE & INVOICE`;
        }
      });
    }

    render();

  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">Error loading clinical session: ${err.message}</div>`;
  }
}
