import * as api from '../assets/js/api.js';

export async function renderLabWork(container, params = {}) {
  container.innerHTML = `
    <div class="page-header flex justify-between items-center">
      <div>
        <h1 class="page-title">Laboratory Work</h1>
        <p class="page-subtitle">Track and manage external lab orders for prosthetics</p>
      </div>
      <button class="btn btn-primary" id="new-lab-order-btn"><i class="fas fa-plus"></i> New Lab Order</button>
    </div>

    <!-- Stats Row -->
    <div class="stats-grid grid-4" style="margin-bottom:24px">
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(59,130,246,0.1); color:#3b82f6"><i class="fas fa-flask"></i></div>
        <div class="stat-value" id="stat-active">0</div>
        <div class="stat-label">Active Orders</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(245,158,11,0.1); color:#f59e0b"><i class="fas fa-truck"></i></div>
        <div class="stat-value" id="stat-transit">0</div>
        <div class="stat-label">In Transit</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(16,185,129,0.1); color:#10b981"><i class="fas fa-check-double"></i></div>
        <div class="stat-value" id="stat-received">0</div>
        <div class="stat-label">Received (Today)</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(239,68,68,0.1); color:#ef4444"><i class="fas fa-clock"></i></div>
        <div class="stat-value" id="stat-overdue">0</div>
        <div class="stat-label">Due Soon</div>
      </div>
    </div>

    <!-- Filters & List -->
    <div class="card">
      <div class="card-header flex justify-between items-center">
         <div class="flex gap-12">
            <button class="btn btn-sm btn-ghost filter-btn active" data-status="all">All</button>
            <button class="btn btn-sm btn-ghost filter-btn" data-status="ordered">Ordered</button>
            <button class="btn btn-sm btn-ghost filter-btn" data-status="in_transit">In Transit</button>
            <button class="btn btn-sm btn-ghost filter-btn" data-status="received">Received</button>
         </div>
      </div>
      <table class="table">
        <thead>
          <tr>
            <th>Order Date</th>
            <th>Patient</th>
            <th>Laboratory</th>
            <th>Type</th>
            <th>Due Date</th>
            <th>Cost</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="lab-work-list">
          <tr><td colspan="8" class="text-center" style="padding:40px"><div class="spinner"></div> Loading orders...</td></tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Modal (Template) -->
    <div class="modal-backdrop" id="lab-modal-backdrop">
      <div class="modal modal-lg">
        <div class="modal-header">
          <div class="modal-title" id="modal-title">New Laboratory Order</div>
          <div class="modal-close" id="modal-close">&times;</div>
        </div>
        <div class="modal-body">
          <form id="lab-order-form">
            <div class="form-grid form-grid-2">
              <div class="form-group">
                <label class="form-label">Patient</label>
                <select class="form-control" id="order-patient-id" required></select>
              </div>
              <div class="form-group">
                <label class="form-label">Laboratory Name</label>
                <input type="text" class="form-control" id="order-lab-name" value="Dental Pro Lab" required>
              </div>
              <div class="form-group">
                <label class="form-label">Work Type</label>
                <select class="form-control" id="order-work-type" required>
                   <option value="Crown (Porcelain)">Crown (Porcelain)</option>
                   <option value="Bridge">Bridge</option>
                   <option value="Denture (Partial)">Denture (Partial)</option>
                   <option value="Denture (Full)">Denture (Full)</option>
                   <option value="Inlay/Onlay">Inlay/Onlay</option>
                   <option value="Custom Abutment">Custom Abutment</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Tooth Number</label>
                <input type="text" class="form-control" id="order-tooth" placeholder="e.g. 16, 26">
              </div>
              <div class="form-group">
                <label class="form-label">Shade (Vita/Classic)</label>
                <input type="text" class="form-control" id="order-shade" placeholder="e.g. A2, B1">
              </div>
              <div class="form-group">
                <label class="form-label">Expected Due Date</label>
                <input type="date" class="form-control" id="order-due-date">
              </div>
            </div>
            <div class="form-group" style="margin-top:12px">
              <label class="form-label">Instructions / Notes</label>
              <textarea class="form-control" id="order-notes" rows="3" placeholder="Additional lab instructions..."></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="modal-cancel">Cancel</button>
          <button class="btn btn-primary" id="save-order-btn">Create Order</button>
        </div>
      </div>
    </div>
  `;

  const list = document.getElementById('lab-work-list');
  const modal = document.getElementById('lab-modal-backdrop');
  let currentFilter = 'all';

  async function loadOrders() {
    try {
      const orders = await api.labWork.list({ status: currentFilter === 'all' ? '' : currentFilter });
      
      // Update Stats
      document.getElementById('stat-active').textContent = orders.filter(o => o.status !== 'received' && o.status !== 'cancelled').length;
      document.getElementById('stat-transit').textContent = orders.filter(o => o.status === 'in_transit').length;
      document.getElementById('stat-received').textContent = orders.filter(o => o.status === 'received' && new Date(o.received_date).toLocaleDateString() === new Date().toLocaleDateString()).length;
      document.getElementById('stat-overdue').textContent = orders.filter(o => o.status !== 'received' && o.due_date && new Date(o.due_date) < new Date()).length;

      if (orders.length === 0) {
        list.innerHTML = '<tr><td colspan="8" class="text-center" style="padding:40px; color:var(--text-muted)">No lab orders found.</td></tr>';
        return;
      }

      const statusCls = { ordered: 'badge-warning', in_transit: 'badge-primary', received: 'badge-success', cancelled: 'badge-muted' };

      list.innerHTML = orders.map(o => `
        <tr>
          <td>${new Date(o.order_date).toLocaleDateString()}</td>
          <td>
             <div style="font-weight:700">${o.first_name} ${o.last_name}</div>
             <div style="font-size:11px; color:var(--text-muted)">Doctor: ${o.doctor_name[0]}. ${o.doctor_surname}</div>
          </td>
          <td>${o.lab_name}</td>
          <td>
             <div style="font-weight:600">${o.work_type}</div>
             <div style="font-size:11px; color:var(--primary)">Tooth: ${o.tooth_number || 'N/A'} | Shade: ${o.shade || '-'}</div>
          </td>
          <td style="color:${new Date(o.due_date) < new Date() && o.status !== 'received' ? 'var(--danger)' : 'inherit'}">
            ${o.due_date ? new Date(o.due_date).toLocaleDateString() : '-'}
          </td>
          <td>€${parseFloat(o.cost).toFixed(2)}</td>
          <td><span class="badge ${statusCls[o.status]}">${o.status.replace('_',' ')}</span></td>
          <td>
            <div class="flex gap-4">
               ${o.status === 'ordered' ? `<button class="btn btn-xs btn-primary update-status" data-id="${o.id}" data-status="in_transit" title="Mark as Shipped"><i class="fas fa-truck"></i></button>` : ''}
               ${o.status !== 'received' ? `<button class="btn btn-xs btn-success update-status" data-id="${o.id}" data-status="received" title="Mark as Received"><i class="fas fa-check"></i></button>` : ''}
               <button class="btn btn-xs btn-ghost delete-order" data-id="${o.id}"><i class="fas fa-trash"></i></button>
            </div>
          </td>
        </tr>
      `).join('');

      // Status Update Handler
      list.querySelectorAll('.update-status').forEach(btn => {
        btn.onclick = async () => {
          const status = btn.dataset.status;
          const payload = { status };
          if (status === 'received') payload.received_date = new Date().toISOString().split('T')[0];
          try {
            await api.labWork.update(btn.dataset.id, payload);
            window.mdsToast('Lab order updated!', 'success');
            loadOrders();
          } catch (err) { window.mdsToast(err.message, 'error'); }
        };
      });

      // Delete Handler
      list.querySelectorAll('.delete-order').forEach(btn => {
        btn.onclick = async () => {
          if (!confirm('Are you sure you want to delete this order?')) return;
          try {
            await api.labWork.delete(btn.dataset.id);
            window.mdsToast('Lab order deleted', 'info');
            loadOrders();
          } catch (err) { window.mdsToast(err.message, 'error'); }
        };
      });

    } catch (err) {
      list.innerHTML = `<tr><td colspan="8" class="text-center" style="color:var(--danger)">Error: ${err.message}</td></tr>`;
    }
  }

  // Filter Buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.status;
      loadOrders();
    };
  });

  // Modal Logic
  document.getElementById('new-lab-order-btn').onclick = async () => {
    modal.classList.add('open');
    const pSel = document.getElementById('order-patient-id');
    const patients = await api.patients.list({ limit: 50 });
    pSel.innerHTML = patients.data.map(p => `<option value="${p.id}">${p.last_name} ${p.first_name} (#${p.id})</option>`).join('');
  };

  document.getElementById('modal-close').onclick = () => modal.classList.remove('open');
  document.getElementById('modal-cancel').onclick = () => modal.classList.remove('open');

  document.getElementById('save-order-btn').onclick = async () => {
    const data = {
      patient_id: document.getElementById('order-patient-id').value,
      lab_name: document.getElementById('order-lab-name').value,
      work_type: document.getElementById('order-work-type').value,
      tooth_number: document.getElementById('order-tooth').value,
      shade: document.getElementById('order-shade').value,
      due_date: document.getElementById('order-due-date').value,
      notes: document.getElementById('order-notes').value
    };
    try {
      await api.labWork.create(data);
      window.mdsToast('Lab order created!', 'success');
      modal.classList.remove('open');
      loadOrders();
    } catch (err) { window.mdsToast(err.message, 'error'); }
  };

  loadOrders();
}
