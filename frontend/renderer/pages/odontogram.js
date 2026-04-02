import * as api from '../assets/js/api.js';

export async function renderOdontogram(container, patientId) {
  try {
    const toothData = await api.client(`/odontogram/${patientId}`);
    const dataMap = {};
    toothData.forEach(t => dataMap[t.tooth_number] = t);

    const states = {
      healthy:   { label: 'Healthy', color: '#10b981', icon: 'check-circle' },
      decayed:   { label: 'Decayed', color: '#ef4444', icon: 'virus' },
      filled:    { label: 'Filled',  color: '#3b82f6', icon: 'fill-drip' },
      missing:   { label: 'Missing', color: '#94a3b8', icon: 'times-circle' },
      crown:     { label: 'Crown',   color: '#f59e0b', icon: 'crown' },
      implant:   { label: 'Implant', color: '#8b5cf6', icon: 'microchip' },
      endodontic:{ label: 'Endo',    color: '#ec4899', icon: 'active-pulse' }
    };

    container.innerHTML = `
      <div class="odontogram-wrapper">
        <div class="odontogram-header">
          <div class="odontogram-legend">
            ${Object.entries(states).map(([k, v]) => `
              <div class="legend-item" data-state="${k}">
                <span class="legend-color" style="background:${v.color}"></span>
                <span class="legend-label">${v.label}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="odontogram-grid">
          <!-- Upper Jaw (18-11, 21-28) -->
          <div class="jaw upper">
            <div class="tooth-row quadrant-1">
              ${[18,17,16,15,14,13,12,11].map(n => renderTooth(n, dataMap[n], states)).join('')}
            </div>
            <div class="tooth-row quadrant-2">
              ${[21,22,23,24,25,26,27,28].map(n => renderTooth(n, dataMap[n], states)).join('')}
            </div>
          </div>
          
          <!-- Lower Jaw (48-41, 31-38) -->
          <div class="jaw lower">
            <div class="tooth-row quadrant-4">
              ${[48,47,46,45,44,43,42,41].map(n => renderTooth(n, dataMap[n], states)).join('')}
            </div>
            <div class="tooth-row quadrant-3">
              ${[31,32,33,34,35,36,37,38].map(n => renderTooth(n, dataMap[n], states)).join('')}
            </div>
          </div>
        </div>

        <div id="tooth-edit-panel" class="tooth-edit-panel" style="display:none">
          <h4 id="edit-tooth-title">Tooth #18</h4>
          <div class="state-selector">
            ${Object.entries(states).map(([k, v]) => `
              <button class="btn btn-outline btn-sm state-btn" data-state="${k}">${v.label}</button>
            `).join('')}
          </div>
          <textarea id="tooth-notes" class="form-control" placeholder="Clinical notes..."></textarea>
          <div style="margin-top:10px;display:flex;gap:8px">
            <button class="btn btn-primary btn-sm" id="save-tooth-btn">Save Status</button>
            <button class="btn btn-ghost btn-sm" id="cancel-tooth-btn">Cancel</button>
          </div>
        </div>
      </div>
    `;

    setupOdontogramEvents(container, patientId, states);

  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

function renderTooth(number, data, states) {
  const state = data?.state || 'healthy';
  const color = states[state].color;
  return `
    <div class="tooth" data-number="${number}" data-state="${state}" title="Tooth #${number} - ${states[state].label}">
      <div class="tooth-number">${number}</div>
      <div class="tooth-icon" style="color:${color}"><i class="fas fa-tooth"></i></div>
      <div class="tooth-status-indicator" style="background:${color}"></div>
    </div>
  `;
}

function setupOdontogramEvents(container, patientId, states) {
  const panel = container.querySelector('#tooth-edit-panel');
  const title = container.querySelector('#edit-tooth-title');
  const notes = container.querySelector('#tooth-notes');
  let activeTooth = null;

  container.querySelectorAll('.tooth').forEach(tooth => {
    tooth.addEventListener('click', () => {
      activeTooth = tooth.dataset.number;
      title.textContent = `Tooth #${activeTooth}`;
      notes.value = ''; // Should ideally fetch existing notes
      panel.style.display = 'block';
      
      // Highlight selected state
      container.querySelectorAll('.state-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.state === tooth.dataset.state);
      });
    });
  });

  container.querySelectorAll('.state-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.state-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  container.querySelector('#save-tooth-btn').addEventListener('click', async () => {
    const selectedStateBtn = container.querySelector('.state-btn.active');
    if (!selectedStateBtn || !activeTooth) return;

    try {
      await api.client(`/odontogram/${patientId}`, {
        method: 'POST',
        body: {
          toothNumber: parseInt(activeTooth),
          state: selectedStateBtn.dataset.state,
          notes: notes.value
        }
      });
      window.mdsToast('Tooth status saved', 'success');
      renderOdontogram(container, patientId); // Refresh
    } catch (err) {
      window.mdsToast(err.message, 'error');
    }
  });

  container.querySelector('#cancel-tooth-btn').addEventListener('click', () => {
    panel.style.display = 'none';
  });
}
