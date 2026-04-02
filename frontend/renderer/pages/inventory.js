import * as api from '../assets/js/api.js';

export async function renderInventory(container) {
  try {
    const items = await api.client('/inventory');
    
    container.innerHTML = `
      <div class="page-header">
        <div class="page-title">
          <h2>Inventory Management</h2>
          <p>Track dental supplies, stock levels, and suppliers</p>
        </div>
        <button class="btn btn-primary" id="add-inventory-btn" ${window.mdsCurrentUser().role === 'receptionist' ? 'disabled' : ''}>
          <i class="fas fa-plus"></i> Add Supply
        </button>
      </div>

      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-icon blue"><i class="fas fa-boxes"></i></div>
          <div class="stat-info">
            <div class="stat-value">${items.length}</div>
            <div class="stat-label">Total Items</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon red"><i class="fas fa-exclamation-triangle"></i></div>
          <div class="stat-info">
            <div class="stat-value">${items.filter(i => parseFloat(i.stock) <= parseFloat(i.min_stock)).length}</div>
            <div class="stat-label">Low Stock Alerts</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Supplier</th>
                <th>In Stock</th>
                <th>Min. Stock</th>
                <th>Price/Unit</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="inventory-table-body">
              ${items.map(item => renderInventoryRow(item)).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add/Edit Modal (placeholder logic similar to patients) -->
    `;

    setupInventoryEvents(container);

  } catch (err) {
    container.innerHTML = `<div class="alert alert-error"><i class="fas fa-exclamation-circle"></i> ${err.message}</div>`;
  }
}

function renderInventoryRow(item) {
  const isLow = parseFloat(item.stock) <= parseFloat(item.min_stock);
  return `
    <tr>
      <td><strong>${item.name}</strong><br><small style="color:var(--text-muted)">${item.unit}</small></td>
      <td>${item.supplier || '—'}</td>
      <td style="font-weight:700;color:${isLow ? 'var(--danger)':'var(--text-primary)'}">${item.stock}</td>
      <td>${item.min_stock}</td>
      <td>€${parseFloat(item.price).toFixed(2)}</td>
      <td>
        <span class="badge ${isLow ? 'badge-danger':'badge-success'}">
          ${isLow ? 'Low Stock' : 'In Stock'}
        </span>
      </td>
      <td>
        <div style="display:flex;gap:4px">
          <button class="btn btn-icon btn-secondary stock-adj" data-id="${item.id}" data-delta="1" title="Add stock"><i class="fas fa-plus"></i></button>
          <button class="btn btn-icon btn-secondary stock-adj" data-id="${item.id}" data-delta="-1" title="Remove stock"><i class="fas fa-minus"></i></button>
          ${window.mdsCurrentUser().role === 'admin' ? 
            `<button class="btn btn-icon btn-ghost delete-item" data-id="${item.id}"><i class="fas fa-trash"></i></button>` : ''}
        </div>
      </td>
    </tr>
  `;
}

async function setupInventoryEvents(container) {
  container.querySelectorAll('.stock-adj').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const delta = parseFloat(btn.dataset.delta);
      try {
        await api.client(`/inventory/${id}/stock`, {
          method: 'PATCH',
          body: { delta }
        });
        renderInventory(container); // Refresh
      } catch (err) {
        window.mdsToast(err.message, 'error');
      }
    });
  });
}
