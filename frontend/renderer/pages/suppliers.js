import * as api from '../assets/js/api.js';

export async function renderSuppliers(container, params = {}) {
  container.innerHTML = `
    <div class="page-header flex justify-between items-center">
      <div>
        <h1 class="page-title">Suppliers & Procurement</h1>
        <p class="page-subtitle">Manage clinical material vendors and optimize your supply chain</p>
      </div>
      <button class="btn btn-primary" id="new-supplier-btn"><i class="fas fa-plus"></i> Add Vendor</button>
    </div>

    <!-- Filters -->
    <div class="card" style="margin-bottom:24px">
      <div class="card-header">
         <div class="flex items-center gap-16">
            <div class="topbar-search" style="max-width:400px">
               <span><i class="fas fa-search"></i></span>
               <input type="text" placeholder="Search by name or category..." id="supp-search">
            </div>
            <div class="flex gap-12" style="margin-left:auto">
               <button class="btn btn-sm btn-ghost filter-btn active" data-cat="all">All Vendors</button>
               <button class="btn btn-sm btn-ghost filter-btn" data-cat="Dental Implants">Implants</button>
               <button class="btn btn-sm btn-ghost filter-btn" data-cat="Consumables">Consumables</button>
               <button class="btn btn-sm btn-ghost filter-btn" data-cat="Orthodontics">Orthodontics</button>
            </div>
         </div>
      </div>
    </div>

    <!-- Suppliers Grid -->
    <div class="grid grid-3 gap-24" id="suppliers-grid">
       <div class="card p-40 text-center col-span-3"><div class="spinner"></div> Loading procurement network...</div>
    </div>

    <!-- Supplier Modal -->
    <div class="modal-backdrop" id="supp-modal-backdrop">
      <div class="modal">
        <div class="modal-header">
           <div class="modal-title" id="supp-modal-title">New Vendor Register</div>
           <div class="modal-close" id="supp-modal-close">&times;</div>
        </div>
        <div class="modal-body">
           <form id="supp-form">
              <div class="form-group">
                 <label class="form-label">Vendor / Company Name</label>
                 <input type="text" class="form-control" id="supp-name" required>
              </div>
              <div class="form-grid form-grid-2">
                 <div class="form-group">
                    <label class="form-label">Contact Person</label>
                    <input type="text" class="form-control" id="supp-contact">
                 </div>
                 <div class="form-group">
                    <label class="form-label">Category</label>
                    <select class="form-control" id="supp-category">
                       <option value="Consumables">Consumables (Gloves, Masks)</option>
                       <option value="Dental Implants">Dental Implants</option>
                       <option value="Orthodontics">Orthodontics</option>
                       <option value="Laboratory Services">Laboratory Services</option>
                       <option value="Instruments">Instruments</option>
                       <option value="Pharmacy">Pharmacy</option>
                    </select>
                 </div>
                 <div class="form-group">
                    <label class="form-label">Phone</label>
                    <input type="text" class="form-control" id="supp-phone">
                 </div>
                 <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-control" id="supp-email">
                 </div>
              </div>
              <div class="form-group" style="margin-top:12px">
                 <label class="form-label">Official Website</label>
                 <input type="url" class="form-control" id="supp-web" placeholder="https://...">
              </div>
              <div class="form-group">
                 <label class="form-label">Office Address</label>
                 <textarea class="form-control" id="supp-address" rows="2"></textarea>
              </div>
           </form>
        </div>
        <div class="modal-footer">
           <button class="btn btn-secondary" id="supp-modal-cancel">Cancel</button>
           <button class="btn btn-primary" id="save-supp-btn">Save Vendor</button>
        </div>
      </div>
    </div>
  `;

  const grid = document.getElementById('suppliers-grid');
  const searchInput = document.getElementById('supp-search');
  const modal = document.getElementById('supp-modal-backdrop');
  let allSuppliers = [];
  let currentFilter = 'all';
  let editingId = null;

  async function loadSuppliers() {
     try {
        allSuppliers = await api.suppliers.list();
        renderGrid();
     } catch (err) {
        grid.innerHTML = `<div class="card p-40 text-center text-danger">Error: ${err.message}</div>`;
     }
  }

  function renderGrid() {
     const query = searchInput.value.toLowerCase().trim();
     const filtered = allSuppliers.filter(s => {
        const matchesCat = currentCategory === 'all' || s.category === currentCategory;
        const matchesSearch = !query || 
           s.name.toLowerCase().includes(query) || 
           s.category.toLowerCase().includes(query) ||
           (s.contact_person && s.contact_person.toLowerCase().includes(query));
        return matchesCat && matchesSearch;
     });

     if (filtered.length === 0) {
        grid.innerHTML = '<div class="card p-40 text-center col-span-3 text-muted">No vendors found.</div>';
        return;
     }

     grid.innerHTML = filtered.map(s => `
        <div class="card p-24 vendor-card animate-scale-in">
           <div class="flex justify-between items-start" style="margin-bottom:16px">
              <div class="stat-icon" style="background:rgba(var(--primary-rgb),0.1); color:var(--primary); width:40px; height:40px"><i class="fas fa-truck-loading"></i></div>
              <div class="flex gap-4">
                 <button class="btn btn-xs btn-ghost edit-supp" data-id="${s.id}"><i class="fas fa-edit"></i></button>
                 <button class="btn btn-xs btn-ghost delete-supp" data-id="${s.id}"><i class="fas fa-trash"></i></button>
              </div>
           </div>
           
           <div style="font-size:18px; font-weight:700; margin-bottom:4px">${s.name}</div>
           <div class="badge badge-sm badge-outline" style="margin-bottom:16px">${s.category}</div>
           
           <div class="flex flex-col gap-8" style="font-size:13px; color:var(--text-muted)">
              ${s.contact_person ? `<div><i class="fas fa-user-tie"></i> ${s.contact_person}</div>` : ''}
              ${s.phone ? `<div><i class="fas fa-phone"></i> ${s.phone}</div>` : ''}
              ${s.email ? `<div><i class="fas fa-envelope"></i> ${s.email}</div>` : ''}
              ${s.website ? `<div><i class="fas fa-external-link-alt"></i> <a href="${s.website}" target="_blank" style="color:var(--primary); text-decoration:none">Visit Website</a></div>` : ''}
           </div>

           <div style="margin-top:20px; padding-top:16px; border-top:1px solid rgba(255,255,255,0.05)">
              <button class="btn btn-sm btn-primary w-full quick-order-btn" data-id="${s.id}"><i class="fas fa-shopping-cart"></i> Quick Order</button>
           </div>
        </div>
     `).join('');

     // Link Buttons
     grid.querySelectorAll('.edit-supp').forEach(btn => {
        btn.onclick = () => {
           const s = allSuppliers.find(x => x.id == btn.dataset.id);
           editingId = s.id;
           document.getElementById('supp-modal-title').textContent = 'Edit Vendor Details';
           document.getElementById('supp-name').value = s.name;
           document.getElementById('supp-contact').value = s.contact_person || '';
           document.getElementById('supp-category').value = s.category;
           document.getElementById('supp-phone').value = s.phone || '';
           document.getElementById('supp-email').value = s.email || '';
           document.getElementById('supp-web').value = s.website || '';
           document.getElementById('supp-address').value = s.address || '';
           modal.classList.add('open');
        };
     });

     grid.querySelectorAll('.delete-supp').forEach(btn => {
        btn.onclick = async () => {
           if (!confirm('Remove this vendor from procurement list?')) return;
           await api.suppliers.delete(btn.dataset.id);
           loadSuppliers();
        };
     });

     grid.querySelectorAll('.quick-order-btn').forEach(btn => {
        btn.onclick = () => window.mdsToast('Procurement order template created. Linked to Inventory tracker.', 'info');
     });
  }

  let currentCategory = 'all';
  document.querySelectorAll('.filter-btn').forEach(btn => {
     btn.onclick = () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.cat;
        renderGrid();
     };
  });

  searchInput.oninput = renderGrid;

  document.getElementById('new-supplier-btn').onclick = () => {
     editingId = null;
     document.getElementById('supp-modal-title').textContent = 'New Vendor Register';
     document.getElementById('supp-form').reset();
     modal.classList.add('open');
  };

  document.getElementById('supp-modal-close').onclick = () => modal.classList.remove('open');
  document.getElementById('supp-modal-cancel').onclick = () => modal.classList.remove('open');

  document.getElementById('save-supp-btn').onclick = async () => {
     const data = {
        name: document.getElementById('supp-name').value,
        contact_person: document.getElementById('supp-contact').value,
        category: document.getElementById('supp-category').value,
        phone: document.getElementById('supp-phone').value,
        email: document.getElementById('supp-email').value,
        website: document.getElementById('supp-web').value,
        address: document.getElementById('supp-address').value
     };
     try {
        if (editingId) await api.suppliers.update(editingId, data);
        else await api.suppliers.create(data);
        window.mdsToast('Vendor registered successfully!', 'success');
        modal.classList.remove('open');
        loadSuppliers();
     } catch (err) { window.mdsToast(err.message, 'error'); }
  };

  loadSuppliers();
}
