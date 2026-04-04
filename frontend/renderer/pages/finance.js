import * as api from '../assets/js/api.js';

export async function renderFinance(container, params = {}) {
  let stats = null;
  try { stats = await api.finance.stats(); } catch (_) {}

  container.innerHTML = `
  <div class="page-header">
    <div class="page-title"><h2>Finance</h2><p>Invoices, payments, and revenue tracking</p></div>
    <button class="btn btn-primary" id="new-invoice-btn"><i class="fas fa-file-invoice-dollar"></i> New Invoice</button>
  </div>

  ${stats ? `
  <div class="stat-grid" style="margin-bottom:24px">
    <div class="stat-card">
      <div class="stat-icon blue"><i class="fas fa-file-invoice"></i></div>
      <div class="stat-info">
        <div class="stat-value">€${parseFloat(stats.totals?.total_billed || 0).toFixed(2)}</div>
        <div class="stat-label">Total Billed</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon green"><i class="fas fa-check-circle"></i></div>
      <div class="stat-info">
        <div class="stat-value">€${parseFloat(stats.totals?.total_collected || 0).toFixed(2)}</div>
        <div class="stat-label">Collected</div>
        <div class="stat-change up">Revenue received</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon red"><i class="fas fa-clock"></i></div>
      <div class="stat-info">
        <div class="stat-value">€${parseFloat(stats.totals?.total_outstanding || 0).toFixed(2)}</div>
        <div class="stat-label">Outstanding</div>
        <div class="stat-change down">Awaiting payment</div>
      </div>
    </div>
  </div>` : ''}

  <div class="card" style="margin-bottom:16px">
    <div class="card-header" style="flex-wrap:wrap;gap:10px">
      <select class="form-control form-select" id="inv-status-filter" style="width:150px">
        <option value="">All Status</option>
        ${['issued','paid','partial','overdue','cancelled'].map(s => `<option value="${s}" ${params.status===s?'selected':''}>${s}</option>`).join('')}
      </select>
      <input type="date" class="form-control" id="inv-from" style="width:150px" placeholder="From">
      <input type="date" class="form-control" id="inv-to" style="width:150px" placeholder="To">
      ${params.patientId ? `<input type="hidden" id="inv-patient-filter" value="${params.patientId}">` :
        `<input class="form-control" type="number" id="inv-patient-filter" style="width:140px" placeholder="Patient ID">`}
      <button class="btn btn-secondary" id="load-inv-btn"><i class="fas fa-filter"></i> Filter</button>
    </div>
  </div>

  <div class="card">
    <div class="table-wrapper" id="inv-table-wrapper">
      <div class="loading-overlay"><div class="spinner"></div></div>
    </div>
  </div>

  <!-- New Invoice Modal -->
  <div class="modal-backdrop" id="inv-modal-backdrop">
    <div class="modal modal-md">
      <div class="modal-header"><div class="modal-title"><i class="fas fa-file-invoice-dollar"></i> New Invoice</div><div class="modal-close" id="inv-modal-close"><i class="fas fa-times"></i></div></div>
      <div class="modal-body">
        <div class="alert alert-info"><span class="alert-icon"><i class="fas fa-info-circle"></i></span> Invoice total is auto-calculated from the linked medical record's treatments.</div>
        <div class="form-grid form-grid-2">
          <div class="form-group"><label class="form-label">Patient ID *</label><input class="form-control" id="new-inv-pid" type="number" value="${params.patientId || ''}"></div>
          <div class="form-group"><label class="form-label">Medical Record ID</label><input class="form-control" id="new-inv-rid" type="number" placeholder="Optional"></div>
          <div class="form-group"><label class="form-label">Discount %</label><input class="form-control" id="new-inv-disc" type="number" value="0" min="0" max="100"></div>
          <div class="form-group"><label class="form-label">Due Date</label><input class="form-control" type="date" id="new-inv-due"></div>
        </div>
        <div class="form-group"><label class="form-label">Notes</label><textarea class="form-control" id="new-inv-notes" rows="2"></textarea></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('inv-modal-backdrop').classList.remove('open')">Cancel</button>
        <button class="btn btn-primary" id="create-inv-btn">Create Invoice</button>
      </div>
    </div>
  </div>

  <!-- Pay Modal -->
  <div class="modal-backdrop" id="pay-modal-backdrop">
    <div class="modal modal-sm">
      <div class="modal-header"><div class="modal-title"><i class="fas fa-credit-card"></i> Record Payment</div><div class="modal-close" onclick="document.getElementById('pay-modal-backdrop').classList.remove('open')"><i class="fas fa-times"></i></div></div>
      <div class="modal-body">
        <div class="form-group"><label class="form-label">Amount (€) *</label><input class="form-control" type="number" id="pay-amount" step="0.01" min="0.01"></div>
        <div class="form-group"><label class="form-label">Payment Method</label>
          <select class="form-control form-select" id="pay-method">
            <option value="cash">Cash</option><option value="card">Card</option><option value="transfer">Bank Transfer</option><option value="insurance">Insurance</option>
          </select>
        </div>
        <input type="hidden" id="pay-inv-id">
      </div>
      <div class="modal-footer">
        <button class="btn btn-success" id="confirm-pay-btn">Record Payment</button>
      </div>
    </div>
  </div>`;

  await loadInvoices();

  document.getElementById('load-inv-btn').addEventListener('click', loadInvoices);
  document.getElementById('new-invoice-btn').addEventListener('click', () => document.getElementById('inv-modal-backdrop').classList.add('open'));
  document.getElementById('inv-modal-backdrop').addEventListener('click', e => { if (e.target.id === 'inv-modal-backdrop') e.target.classList.remove('open'); });
  document.getElementById('inv-modal-close').addEventListener('click', () => document.getElementById('inv-modal-backdrop').classList.remove('open'));

  document.getElementById('create-inv-btn').addEventListener('click', async () => {
    const btn = document.getElementById('create-inv-btn');
    const pid = document.getElementById('new-inv-pid').value;
    if (!pid) { window.mdsToast('Patient ID required', 'error'); return; }
    btn.textContent = 'Creating…'; btn.disabled = true;
    try {
      await api.finance.createInvoice({ patient_id: pid, record_id: document.getElementById('new-inv-rid').value || null, discount_percent: document.getElementById('new-inv-disc').value, due_date: document.getElementById('new-inv-due').value || null, notes: document.getElementById('new-inv-notes').value });
      window.mdsToast('Invoice created', 'success');
      document.getElementById('inv-modal-backdrop').classList.remove('open');
      await loadInvoices();
    } catch (err) { window.mdsToast(err.message, 'error'); }
    finally { btn.textContent = 'Create Invoice'; btn.disabled = false; }
  });

  document.getElementById('confirm-pay-btn').addEventListener('click', async () => {
    const invId = document.getElementById('pay-inv-id').value;
    const amount = document.getElementById('pay-amount').value;
    const method = document.getElementById('pay-method').value;
    if (!amount) { window.mdsToast('Amount required', 'error'); return; }
    try {
      await api.finance.pay(invId, amount, method);
      window.mdsToast('Payment recorded', 'success');
      document.getElementById('pay-modal-backdrop').classList.remove('open');
      await loadInvoices();
    } catch (err) { window.mdsToast(err.message, 'error'); }
  });

  async function loadInvoices() {
    const wrapper = document.getElementById('inv-table-wrapper');
    wrapper.innerHTML = `<div class="loading-overlay"><div class="spinner"></div></div>`;
    const qp = {};
    const status = document.getElementById('inv-status-filter').value;
    const pid = document.getElementById('inv-patient-filter')?.value;
    const from = document.getElementById('inv-from')?.value;
    const to = document.getElementById('inv-to')?.value;
    if (status) qp.status = status;
    if (pid) qp.patient_id = pid;
    if (from) qp.from = from;
    if (to) qp.to = to;

    try {
      const resp = await api.finance.invoices(qp);
      // Support both wrapped {data:[]} and direct [] responses
      const invs = Array.isArray(resp) ? resp : (resp.data || []);
      const statusCls = { paid:'badge-success', issued:'badge-primary', partial:'badge-warning', overdue:'badge-danger', draft:'badge-muted', cancelled:'badge-muted' };

      if (invs.length === 0) {
        wrapper.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><i class="fas fa-file-invoice-dollar"></i></div><h3>No invoices found</h3></div>`;
        return;
      }
      wrapper.innerHTML = `<table>
        <thead><tr><th>Invoice #</th><th>Patient</th><th>Date</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          ${invs.map(inv => `<tr>
            <td style="font-family:monospace;font-size:12px">${inv.invoice_number}</td>
            <td><span style="cursor:pointer;color:var(--primary);font-weight:500" onclick="mdsNavigateTo('patient-detail',{id:${inv.patient_id}})">${inv.first_name} ${inv.last_name}</span></td>
            <td>${new Date(inv.issue_date).toLocaleDateString('sk-SK')}</td>
            <td style="font-weight:600">€${parseFloat(inv.total).toFixed(2)}</td>
            <td>€${parseFloat(inv.paid_amount).toFixed(2)}</td>
            <td style="font-weight:700;color:${parseFloat(inv.balance)>0?'var(--danger)':'var(--success)'}">€${parseFloat(inv.balance).toFixed(2)}</td>
            <td><span class="badge ${statusCls[inv.status]||'badge-muted'}">${inv.status}</span></td>
            <td>
              <div class="flex gap-4">
                <button class="btn btn-sm btn-ghost view-inv-btn" data-id="${inv.id}" title="View/Print"><i class="fas fa-print"></i></button>
                ${inv.status !== 'paid' && inv.status !== 'cancelled' ? `<button class="btn btn-sm btn-success pay-btn" data-id="${inv.id}" data-balance="${inv.balance}"><i class="fas fa-credit-card"></i> Pay</button>` : ''}
              </div>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>`;

      document.querySelectorAll('.view-inv-btn').forEach(btn => {
        btn.addEventListener('click', () => window.mdsRenderInvoiceModal(btn.dataset.id));
      });

      document.querySelectorAll('.pay-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.getElementById('pay-inv-id').value = btn.dataset.id;
          document.getElementById('pay-amount').value = parseFloat(btn.dataset.balance).toFixed(2);
          document.getElementById('pay-modal-backdrop').classList.add('open');
        });
      });
    } catch (err) {
      wrapper.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><i class="fas fa-exclamation-triangle"></i></div><h3>${err.message}</h3></div>`;
    }
  }
}
