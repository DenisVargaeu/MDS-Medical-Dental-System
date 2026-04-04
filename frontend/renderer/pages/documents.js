import * as api from '../assets/js/api.js';

export async function renderDocuments(container, params = {}) {
  container.innerHTML = `
    <div class="page-header flex justify-between items-center">
      <div>
        <h1 class="page-title">Document & Consent Gallery</h1>
        <p class="page-subtitle">Centralized hub for clinical photos, X-rays, and patient consents</p>
      </div>
    </div>

    <!-- Filters Row -->
    <div class="card" style="margin-bottom:24px">
      <div class="card-header flex justify-between items-center">
         <div class="flex items-center gap-16" style="width:100%">
            <div class="flex gap-12">
               <button class="btn btn-sm btn-ghost filter-btn active" data-cat="all">All Files</button>
               <button class="btn btn-sm btn-ghost filter-btn" data-cat="xray">X-Rays</button>
               <button class="btn btn-sm btn-ghost filter-btn" data-cat="photo">Photos</button>
               <button class="btn btn-sm btn-ghost filter-btn" data-cat="consent">Consents</button>
               <button class="btn btn-sm btn-ghost filter-btn" data-cat="lab_result">Lab Results</button>
            </div>
            <div class="topbar-search" style="max-width:300px; margin-left:auto">
               <span><i class="fas fa-search"></i></span>
               <input type="text" placeholder="Filter by Patient ID or Name..." id="doc-search">
            </div>
         </div>
      </div>
    </div>

    <!-- Gallery Grid -->
    <div class="grid grid-4 gap-24" id="gallery-container">
       <div class="card p-40 text-center col-span-4">
          <div class="spinner"></div> Loading gallery items...
       </div>
    </div>

    <!-- Image Preview Modal -->
    <div class="modal-backdrop" id="doc-preview-modal">
       <div class="modal modal-lg" style="background:transparent; border:none; box-shadow:none">
          <div class="modal-close" id="preview-close" style="color:white; font-size:40px; top:-40px; right:0">&times;</div>
          <img id="preview-img" style="width:100%; border-radius:12px; box-shadow:0 20px 50px rgba(0,0,0,0.5)">
          <div id="preview-info" style="color:white; margin-top:12px; text-align:center">
             <div id="preview-title" style="font-weight:700; font-size:18px"></div>
             <div id="preview-meta" style="font-size:12px; opacity:0.8"></div>
          </div>
       </div>
    </div>
  `;

  const gallery = document.getElementById('gallery-container');
  const searchInput = document.getElementById('doc-search');
  const previewModal = document.getElementById('doc-preview-modal');
  let allFiles = [];
  let currentCategory = 'all';

  async function loadFiles() {
     try {
        const res = await api.request('GET', '/files/all'); // Need to ensure /api/files/all exists
        allFiles = res || [];
        renderGallery();
     } catch (err) {
        gallery.innerHTML = `<div class="card p-40 text-center col-span-4 text-danger">Error: ${err.message}</div>`;
     }
  }

  function renderGallery() {
     const query = searchInput.value.toLowerCase().trim();
     const filtered = allFiles.filter(f => {
        const matchesCat = currentCategory === 'all' || f.category === currentCategory;
        const matchesSearch = !query || 
           f.original_name.toLowerCase().includes(query) || 
           (f.first_name && f.first_name.toLowerCase().includes(query)) ||
           (f.last_name && f.last_name.toLowerCase().includes(query));
        return matchesCat && matchesSearch;
     });

     if (filtered.length === 0) {
        gallery.innerHTML = `<div class="card p-40 text-center col-span-4 text-muted">No files found matching criteria.</div>`;
        return;
     }

     gallery.innerHTML = filtered.map(f => `
        <div class="card doc-card animate-scale-in" data-id="${f.id}">
           <div class="doc-preview-thumb">
              ${isImage(f.mime_type) 
                ? `<img src="${window.mdsConfig.apiUrl}/uploads/${f.stored_name}" alt="${f.original_name}">`
                : `<div class="doc-icon-placeholder"><i class="fas fa-file-pdf"></i></div>`}
              <div class="doc-overlay">
                 <button class="btn btn-xs btn-white view-doc" data-id="${f.id}">View</button>
                 <a href="${window.mdsConfig.apiUrl}/uploads/${f.stored_name}" download class="btn btn-xs btn-white"><i class="fas fa-download"></i></a>
              </div>
           </div>
           <div class="p-12">
              <div class="flex justify-between items-start">
                 <div style="max-width:140px" class="truncate" title="${f.original_name}">${f.original_name}</div>
                 <span class="badge badge-sm">${f.category.replace('_',' ')}</span>
              </div>
              <div style="font-size:11px; color:var(--text-muted); margin-top:4px">
                 Patient: <b>${f.last_name} ${f.first_name}</b>
              </div>
              <div style="font-size:10px; color:var(--text-muted); margin-top:2px">
                 ${new Date(f.uploaded_at).toLocaleDateString()}
              </div>
           </div>
        </div>
     `).join('');

     // Preview Handlers
     gallery.querySelectorAll('.view-doc').forEach(btn => {
        btn.onclick = () => {
           const file = allFiles.find(f => f.id == btn.dataset.id);
           if (!isImage(file.mime_type)) return window.open(`${window.mdsConfig.apiUrl}/uploads/${file.stored_name}`);
           
           document.getElementById('preview-img').src = `${window.mdsConfig.apiUrl}/uploads/${file.stored_name}`;
           document.getElementById('preview-title').textContent = file.original_name;
           document.getElementById('preview-meta').textContent = `Patient: ${file.last_name} ${file.first_name} | Uploaded: ${new Date(file.uploaded_at).toLocaleDateString()}`;
           previewModal.classList.add('open');
        };
     });
  }

  function isImage(mime) {
     return mime && mime.startsWith('image/');
  }

  searchInput.oninput = renderGallery;

  document.querySelectorAll('.filter-btn').forEach(btn => {
     btn.onclick = () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.cat;
        renderGallery();
     };
  });

  document.getElementById('preview-close').onclick = () => previewModal.classList.remove('open');
  previewModal.onclick = (e) => { if (e.target === previewModal) previewModal.classList.remove('open'); };

  loadFiles();
}
