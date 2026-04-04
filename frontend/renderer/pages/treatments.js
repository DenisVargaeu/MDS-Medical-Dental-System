import * as api from '../assets/js/api.js';

export async function renderTreatments(container) {
  let treatments = [];
  let categories = [];

  async function load() {
    const resp = await api.treatments.list();
    // Support both wrapped {data:[]} and direct [] responses
    treatments = Array.isArray(resp) ? resp : (resp.data || []);
    categories = [...new Set(treatments.map(t => t.category).filter(Boolean))].sort();
    render();
  }

  function render() {
    const filtered = document.getElementById('treat-search')
      ? treatments.filter(t => t.name.toLowerCase().includes(document.getElementById('treat-search').value.toLowerCase()) || (t.category || '').toLowerCase().includes(document.getElementById('treat-search').value.toLowerCase()))
      : treatments;

    // Group by category
    const grouped = {};
    filtered.forEach(t => {
      const cat = t.category || 'Other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(t);
    });

    document.getElementById('treat-table').innerHTML = Object.entries(grouped).map(([cat, items]) => `
      <div style="margin-bottom:24px">
        <h3 style="font-size:13px;font-weight:700;color:var(--text-muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">${cat}</h3>
        <div class="card">
          <div class="table-wrapper">
            <table>
              <thead><tr><th>Treatment Name</th><th>Duration</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                ${items.map(t => `<tr>
                  <td>
                    <div style="font-weight:600">${t.name}</div>
                    ${t.description ? `<div style="font-size:11px;color:var(--text-muted)">${t.description.slice(0,80)}</div>` : ''}
                  </td>
                  <td>${t.duration_minutes} min</td>
                  <td style="font-weight:700;color:var(--primary)">€${parseFloat(t.price).toFixed(2)}</td>
                  <td><span class="badge ${t.active ? 'badge-success' : 'badge-muted'}">${t.active ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <button class="btn btn-sm btn-secondary edit-treat" data-id="${t.id}"><i class="fas fa-edit"></i> Edit</button>
                    <button class="btn btn-sm btn-ghost toggle-treat" data-id="${t.id}" data-active="${t.active}">${t.active ? '<i class="fas fa-toggle-on"></i> Deactivate' : '<i class="fas fa-toggle-off"></i> Activate'}</button>
                  </td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>`).join('') || '<div class="empty-state"><div class="empty-state-icon"><i class="fas fa-tooth"></i></div><h3>No treatments found</h3></div>';

    attachActions();
  }

  function attachActions() {
    document.querySelectorAll('.toggle-treat').forEach(btn => {
      btn.addEventListener('click', async () => {
        const active = btn.dataset.active === '1' ? 0 : 1;
        await api.treatments.update(parseInt(btn.dataset.id), { active });
        await load();
      });
    });
    document.querySelectorAll('.edit-treat').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = treatments.find(x => x.id === parseInt(btn.dataset.id));
        if (t) openModal(t);
      });
    });
  }

  container.innerHTML = `
  <div class="page-header">
    <div class="page-title"><h2>Treatments</h2><p>Manage dental procedures catalog and pricing</p></div>
    <button class="btn btn-primary" id="new-treat-btn"><i class="fas fa-plus-circle"></i> Add Treatment</button>
  </div>
  <div class="card" style="margin-bottom:16px;padding:12px 16px">
    <div class="search-bar"><span><i class="fas fa-search"></i></span><input type="text" id="treat-search" placeholder="Search treatments…"></div>
  </div>
  <div id="treat-table"></div>
  <div class="modal-backdrop" id="treat-modal-backdrop">
    <div class="modal modal-md">
      <div class="modal-header">
        <div class="modal-title" id="treat-modal-title"><i class="fas fa-tooth"></i> Add Treatment</div>
        <div class="modal-close" id="treat-modal-close"><i class="fas fa-times"></i></div>
      </div>
      <div class="modal-body">
        <input type="hidden" id="treat-id">
        <div class="form-grid form-grid-2">
          <div class="form-group" style="grid-column:1/-1"><label class="form-label">Name *</label><input class="form-control" id="t-name"></div>
          <div class="form-group"><label class="form-label">Category</label>
            <input class="form-control" id="t-cat" list="cat-list" placeholder="e.g. Preventive">
            <datalist id="cat-list">
              ${(categories || []).map(c => `<option value="${c}">`).join('')}
            </datalist>
          </div>
          <div class="form-group"><label class="form-label">Price (€) *</label><input class="form-control" type="number" id="t-price" step="0.01" min="0"></div>
          <div class="form-group"><label class="form-label">Duration (min)</label><input class="form-control" type="number" id="t-dur" value="30" min="5"></div>
        </div>
        <div class="form-group"><label class="form-label">Description</label><textarea class="form-control" id="t-desc"></textarea></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="cancel-treat-btn">Cancel</button>
        <button class="btn btn-primary" id="save-treat-btn">Save</button>
      </div>
    </div>
  </div>`;

  await load();

  document.getElementById('treat-search').addEventListener('input', render);
  document.getElementById('new-treat-btn').addEventListener('click', () => openModal(null));
  document.getElementById('treat-modal-close').addEventListener('click', closeModal);
  document.getElementById('cancel-treat-btn').addEventListener('click', closeModal);
  document.getElementById('treat-modal-backdrop').addEventListener('click', e => { if (e.target.id === 'treat-modal-backdrop') closeModal(); });
  document.getElementById('save-treat-btn').addEventListener('click', saveT);

  let editId = null;
  function openModal(t) {
    editId = t?.id || null;
    document.getElementById('treat-modal-title').textContent = t ? 'Edit Treatment' : 'Add Treatment';
    document.getElementById('t-name').value = t?.name || '';
    document.getElementById('t-cat').value = t?.category || '';
    document.getElementById('t-price').value = t?.price || '';
    document.getElementById('t-dur').value = t?.duration_minutes || 30;
    document.getElementById('t-desc').value = t?.description || '';
    document.getElementById('treat-modal-backdrop').classList.add('open');
  }
  function closeModal() { document.getElementById('treat-modal-backdrop').classList.remove('open'); }

  async function saveT() {
    const btn = document.getElementById('save-treat-btn');
    const name = document.getElementById('t-name').value.trim();
    const price = document.getElementById('t-price').value;
    if (!name || !price) { window.mdsToast('Name and price required', 'error'); return; }
    btn.textContent = 'Saving…'; btn.disabled = true;
    try {
      const d = { name, category: document.getElementById('t-cat').value, price: parseFloat(price), duration_minutes: parseInt(document.getElementById('t-dur').value), description: document.getElementById('t-desc').value };
      if (editId) await api.treatments.update(editId, d); else await api.treatments.create(d);
      window.mdsToast('Treatment saved', 'success');
      closeModal();
      await load();
    } catch (err) { window.mdsToast(err.message, 'error'); }
    finally { btn.textContent = 'Save'; btn.disabled = false; }
  }
}
