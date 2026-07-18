/* ==========================================================================
شطّب - دفتر مرجع التصميم
الملف الرئيسي للوظائف - الإصدار المحسّن (أيقونات، أنيميشن، وتصدير احترافي)
========================================================================== */

/* --------------------------------------------------------------------------
1. بدء التطبيق عند تحميل الصفحة
-------------------------------------------------------------------------- */
window.addEventListener('load', () => {
  loadFromLocalStorage();
  startAutoSave();
});

/* --------------------------------------------------------------------------
2. التخزين المحلي والحفظ التلقائي
-------------------------------------------------------------------------- */
function saveToLocalStorage() {
  try {
    localStorage.setItem('designReferenceBook', JSON.stringify(state));
    showAutosaveIndicator();
    return true;
  } catch (err) {
    console.warn('Auto-save failed:', err);
    if (err.name === 'QuotaExceededError') {
      showToast('تنبيه: الذاكرة ممتلئة! احذف بعض الصور أو صدر الملف كـ JSON', 'error');
    }
    return false;
  }
}

function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem('designReferenceBook');
    if (saved) {
      const loaded = JSON.parse(saved);
      if (loaded.project) Object.assign(state.project, loaded.project);
      if (loaded.rooms) state.rooms = loaded.rooms;
      if (loaded.colors) state.colors = loaded.colors;
      if (loaded.materials) state.materials = loaded.materials;
      if (loaded.signature) Object.assign(state.signature, loaded.signature);
      renderAll();
    }
  } catch (err) {
    console.warn('Load failed, clearing corrupted data:', err);
    localStorage.removeItem('designReferenceBook');
  }
}

function showAutosaveIndicator() {
  const indicator = document.getElementById('autosaveIndicator');
  indicator.classList.add('show');
  setTimeout(() => indicator.classList.remove('show'), 2000);
}

function startAutoSave() {
  setInterval(saveToLocalStorage, 30000);
}

/* --------------------------------------------------------------------------
3. الوضع الليلي
-------------------------------------------------------------------------- */
document.getElementById('themeToggle').onclick = () => {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isDark);
  document.body.style.transition = 'background-color 0.5s ease, color 0.5s ease';
};

if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark-mode');
}

/* --------------------------------------------------------------------------
4. حالة التطبيق (State)
-------------------------------------------------------------------------- */
let uid = 1;
const newId = () => 'id' + (uid++) + '_' + Date.now().toString(36);

const state = {
  project: {
    name: '',
    client: '',
    engineer: '',
    date: new Date().toISOString().slice(0, 10)
  },
  rooms: [
    mkRoom('غرفة النوم'),
    mkRoom('الحمام'),
    mkRoom('المطبخ'),
    mkRoom('الصالة')
  ],
  colors: [],
  materials: [],
  signature: {
    dataUrl: '',
    name: '',
    date: new Date().toISOString().slice(0, 10),
    approved: false,
    approvedAt: ''
  }
};

function mkRoom(name) {
  return { id: newId(), name, images: [], notes: '' };
}

let currentTab = 'project';

function sheetTagForRoom(index) {
  return 'A-' + (101 + index);
}

/* --------------------------------------------------------------------------
5. شريط التقدم
-------------------------------------------------------------------------- */
function updateProgress() {
  const totalTasks = Math.max(1, state.rooms.length + 1);
  const completedTasks = state.rooms.filter(r => r.images.length > 0).length + (state.project.name ? 1 : 0);
  const percent = Math.min(100, Math.round((completedTasks / totalTasks) * 100));
  document.getElementById('progressPercent').textContent = percent + '%';
  document.getElementById('progressFill').style.width = percent + '%';
}

/* --------------------------------------------------------------------------
6. الشريط الجانبي (Sidebar)
-------------------------------------------------------------------------- */
function renderSidebar() {
  document.getElementById('projectSubtitle').textContent =
    state.project.name ? ('مشروع: ' + state.project.name) : 'بدون اسم مشروع بعد';
  
  const navProject = document.getElementById('navProject');
  navProject.innerHTML = '';
  navProject.appendChild(navItem('project', 'بيانات المشروع', 'project', currentTab === 'project'));

  const navRooms = document.getElementById('navRooms');
  navRooms.innerHTML = '';
  state.rooms.forEach((room, i) => {
    const item = navItem('room', room.name, room.id, currentTab === room.id, room.images.length);
    item.draggable = true;
    item.dataset.roomId = room.id;
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('drop', handleDrop);
    item.addEventListener('dragend', handleDragEnd);
    navRooms.appendChild(item);
  });

  const navEnd = document.getElementById('navEnd');
  navEnd.innerHTML = '';
  navEnd.appendChild(navItem('colors', 'الألوان والدهانات', 'colors', currentTab === 'colors', state.colors.length));
  navEnd.appendChild(navItem('materials', 'المواد والخامات', 'materials', currentTab === 'materials', state.materials.length));
  navEnd.appendChild(navItem('signature', 'اعتماد التصميم', 'signature', currentTab === 'signature'));
  
  updateProgress();
}

/* --------------------------------------------------------------------------
7. Drag & Drop للغرف
-------------------------------------------------------------------------- */
let draggedRoomId = null;

function handleDragStart(e) {
  draggedRoomId = this.dataset.roomId;
  this.style.opacity = '0.4';
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
  e.preventDefault();
  this.style.borderTop = '2px solid var(--brass)';
  e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e) {
  e.preventDefault();
  this.style.borderTop = '';
  const targetId = this.dataset.roomId;
  if (!draggedRoomId || draggedRoomId === targetId) return;
  
  const fromIndex = state.rooms.findIndex(r => r.id === draggedRoomId);
  const toIndex = state.rooms.findIndex(r => r.id === targetId);
  if (fromIndex === -1 || toIndex === -1) return;
  
  const [moved] = state.rooms.splice(fromIndex, 1);
  state.rooms.splice(toIndex, 0, moved);
  saveToLocalStorage();
  renderSidebar();
  showToast('تم إعادة ترتيب الغرف', 'success');
}

function handleDragEnd(e) {
  this.style.opacity = '';
  document.querySelectorAll('.nav-item').forEach(i => i.style.borderTop = '');
}

/* --------------------------------------------------------------------------
8. عناصر التنقل والأيقونات
-------------------------------------------------------------------------- */
const NAV_ICONS = {
  project: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>',
  colors: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="1.5" fill="currentColor" stroke="none"/><circle cx="13" cy="8" r="1.5" fill="currentColor" stroke="none"/><circle cx="16" cy="12" r="1.5" fill="currentColor" stroke="none"/></svg>',
  materials: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/></svg>',
  signature: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l4-1 10-10 1 1-10 10-1 4z"/><path d="M4 21h16"/></svg>',
  room: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M14 12h.01"/></svg>'
};

function navIconFor(tabKey) {
  return NAV_ICONS[tabKey] || NAV_ICONS.room;
}

function navItem(iconKey, label, tabKey, active, count) {
  const btn = document.createElement('button');
  btn.className = 'nav-item' + (active ? ' active' : '');
  btn.innerHTML = `<span class="icon" aria-hidden="true">${navIconFor(iconKey)}</span><span>${escapeHtml(label)}</span>` +
    (count !== undefined ? `<span class="count">${count}</span>` : '');
  btn.onclick = () => { currentTab = tabKey; renderAll(); };
  return btn;
}

const TAB_LABELS = {
  project: 'بيانات المشروع',
  colors: 'الألوان والدهانات',
  materials: 'المواد والخامات',
  signature: 'اعتماد التصميم'
};

function tabLabel(tab) {
  return TAB_LABELS[tab] || (state.rooms.find(r => r.id === tab)?.name || '');
}

function renderBreadcrumb() {
  document.getElementById('breadcrumb').innerHTML =
    `<span>شطّب</span><span class="crumb-sep">/</span><span class="crumb-current">${escapeHtml(tabLabel(currentTab))}</span>`;
  const mt = document.getElementById('mobileTopbarTab');
  if (mt) mt.textContent = tabLabel(currentTab);
}

/* --------------------------------------------------------------------------
9. عرض كل شيء
-------------------------------------------------------------------------- */
function renderAll() {
  renderSidebar();
  renderBreadcrumb();
  const main = document.getElementById('mainContent');
  main.innerHTML = '';
  
  // إضافة أنيميشن دخول ناعم
  main.style.opacity = '0';
  main.style.transform = 'translateY(10px)';
  
  if (currentTab === 'project') main.appendChild(renderProjectSheet());
  else if (currentTab === 'colors') main.appendChild(renderColorsSheet());
  else if (currentTab === 'materials') main.appendChild(renderMaterialsSheet());
  else if (currentTab === 'signature') main.appendChild(renderSignatureSheet());
  else {
    const room = state.rooms.find(r => r.id === currentTab);
    if (room) main.appendChild(renderRoomSheet(room));
  }
  
  // تفعيل الأنيميشن
  requestAnimationFrame(() => {
    main.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    main.style.opacity = '1';
    main.style.transform = 'translateY(0)';
  });
  
  closeDrawer();
}

function sheetShell(tag, title, desc, bodyEl) {
  const wrap = document.createElement('div');
  wrap.className = 'sheet';
  wrap.innerHTML = `<div class="title-block"><div><h2>${escapeHtml(title)}</h2><div class="desc">${escapeHtml(desc)}</div></div></div><div class="body-pad"></div>`;
  wrap.querySelector('.body-pad').appendChild(bodyEl);
  return wrap;
}

/* --------------------------------------------------------------------------
10. صفحة المشروع
-------------------------------------------------------------------------- */
function renderProjectSheet() {
  const body = document.createElement('div');
  body.innerHTML = `
    <div class="top-hint">هذا الملف بمثابة دفتر مرجعي يوثّق اختيارات العميل قبل التنفيذ.</div>
    <h3 class="section-label">بيانات المشروع</h3>
    <div class="field-row">
      <div class="field"><label class="field-label">اسم المشروع</label><input type="text" id="pName" placeholder="مثال: شقة التجمع الخامس"></div>
      <div class="field"><label class="field-label">اسم العميل</label><input type="text" id="pClient" placeholder="اسم العميل"></div>
    </div>
    <div class="field-row">
      <div class="field"><label class="field-label">اسم المهندس / المصمم</label><input type="text" id="pEngineer" placeholder="اسمك"></div>
      <div class="field"><label class="field-label">التاريخ</label><input type="date" id="pDate"></div>
    </div>
    <div class="summary-grid" id="projectSummary"></div>`;
  
  body.querySelector('#pName').value = state.project.name;
  body.querySelector('#pClient').value = state.project.client;
  body.querySelector('#pEngineer').value = state.project.engineer;
  body.querySelector('#pDate').value = state.project.date;

  body.querySelector('#pName').oninput = e => { state.project.name = e.target.value; renderSidebar(); saveToLocalStorage(); };
  body.querySelector('#pClient').oninput = e => { state.project.client = e.target.value; saveToLocalStorage(); };
  body.querySelector('#pEngineer').oninput = e => { state.project.engineer = e.target.value; saveToLocalStorage(); };
  body.querySelector('#pDate').oninput = e => { state.project.date = e.target.value; saveToLocalStorage(); };

  const summary = body.querySelector('#projectSummary');
  const totalImgs = state.rooms.reduce((s, r) => s + r.images.length, 0);
  [
    ['عدد الغرف', state.rooms.length],
    ['إجمالي الصور', totalImgs],
    ['عدد الألوان', state.colors.length],
    ['عدد الخامات', state.materials.length],
    ['حالة الاعتماد', state.signature.approved ? 'معتمد ✓' : 'بانتظار التوقيع']
  ].forEach(([l, n]) => {
    const c = document.createElement('div');
    c.className = 'summary-card';
    c.innerHTML = `<div class="n mono">${n}</div><div class="l">${l}</div>`;
    summary.appendChild(c);
  });
  
  return sheetShell('A-100', 'بيانات المشروع', 'صفحة الغلاف', body);
}

/* --------------------------------------------------------------------------
11. صفحة الغرفة
-------------------------------------------------------------------------- */
function renderRoomSheet(room) {
  const idx = state.rooms.indexOf(room);
  const body = document.createElement('div');
  
  body.appendChild(header(room, idx));
  
  const st = document.createElement('h3');
  st.className = 'section-label';
  st.textContent = `الصور المرجعية (${room.images.length})`;
  body.appendChild(st);
  
  const dz = document.createElement('div');
  dz.className = 'dropzone no-print';
  dz.innerHTML = `<strong>اضغط هنا لرفع صور ${escapeHtml(room.name)}</strong><div class="hint">أو اسحب الصور وأفلتها هنا</div>`;
  const fi = document.createElement('input');
  fi.type = 'file';
  fi.accept = 'image/*';
  fi.multiple = true;
  dz.appendChild(fi);
  dz.onclick = () => fi.click();
  
  ['dragover', 'dragenter'].forEach(e => dz.addEventListener(e, ev => { ev.preventDefault(); dz.classList.add('drag'); }));
  ['dragleave', 'drop'].forEach(e => dz.addEventListener(e, ev => { ev.preventDefault(); dz.classList.remove('drag'); }));
  dz.addEventListener('drop', e => handleFiles(room, e.dataTransfer.files));
  fi.onchange = e => handleFiles(room, e.target.files);
  body.appendChild(dz);
  
  if (!room.images.length) {
    const em = document.createElement('div');
    em.className = 'empty-note';
    em.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:48px;height:48px;margin-bottom:12px;opacity:0.4;"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg><br>لا توجد صور مرفوعة بعد.`;
    body.appendChild(em);
  } else {
    const strip = document.createElement('div');
    strip.className = 'img-strip';
    room.images.forEach((img, i) => strip.appendChild(imageCard(room, img, i)));
    body.appendChild(strip);
  }
  
  const nw = document.createElement('div');
  nw.style.marginTop = '28px';
  nw.style.paddingTop = '20px';
  nw.style.borderTop = '1px dashed var(--paper-line)';
  const nt = document.createElement('h3');
  nt.className = 'section-label';
  nt.textContent = `ملاحظات ${room.name}`;
  nw.appendChild(nt);
  const na = document.createElement('textarea');
  na.placeholder = 'اكتب هنا أي ملاحظات...';
  na.value = room.notes;
  na.oninput = e => { room.notes = e.target.value; saveToLocalStorage(); };
  nw.appendChild(na);
  body.appendChild(nw);
  
  return sheetShell(sheetTagForRoom(idx), room.name, 'مرجع الصور والملاحظات', body);
}

/* --------------------------------------------------------------------------
12. هيدر الغرفة مع زر الحذف
-------------------------------------------------------------------------- */
function header(room, idx) {
  const h = document.createElement('div');
  h.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding:10px 14px;background:var(--empty-bg);border-radius:6px;border:1px solid var(--paper-line);position:relative;z-index:10;';
  
  const ni = document.createElement('input');
  ni.type = 'text';
  ni.value = room.name;
  ni.setAttribute('aria-label', 'اسم الغرفة');
  ni.style.cssText = 'max-width:260px;font-weight:600;font-size:15px;padding:6px 10px;border:1px solid var(--paper-line);border-radius:4px;background:var(--input-bg);color:var(--ink);';
  ni.oninput = e => { room.name = e.target.value || room.name; renderSidebar(); saveToLocalStorage(); };
  
  const del = document.createElement('button');
  del.className = 'btn-danger-text';
  del.textContent = '🗑️ حذف هذه الغرفة';
  del.setAttribute('aria-label', 'حذف غرفة ' + room.name);
  del.style.cssText = 'color:var(--danger);font-size:14px;font-weight:700;cursor:pointer;padding:8px 14px;border:1px solid var(--danger);border-radius:4px;background:var(--card-bg);white-space:nowrap;transition:all 0.2s;position:relative;z-index:1;pointer-events:auto;';
  del.onmouseover = () => { del.style.background = 'var(--danger)'; del.style.color = '#fff'; };
  del.onmouseout = () => { del.style.background = 'var(--card-bg)'; del.style.color = 'var(--danger)'; };
  
  del.addEventListener('click', async function (event) {
    event.preventDefault();
    event.stopPropagation();
    const ok = await showConfirm({
      title: 'حذف الغرفة؟',
      message: 'هل أنت متأكد من حذف غرفة "' + room.name + '"؟ لا يمكن التراجع عن هذا الإجراء.',
      confirmLabel: 'حذف الغرفة',
      icon: '🗑️'
    });
    if (ok) {
      const i = state.rooms.findIndex(r => r.id === room.id);
      if (i !== -1) {
        state.rooms.splice(i, 1);
        saveToLocalStorage();
        currentTab = 'project';
        renderAll();
        showToast('تم حذف غرفة "' + room.name + '" بنجاح', 'info');
      }
    }
  });
  
  const left = document.createElement('div');
  left.style.cssText = 'display:flex;align-items:center;gap:10px;flex:1;';
  left.innerHTML = '<label style="font-weight:600;color:var(--ink-soft);">اسم الغرفة:</label>';
  left.appendChild(ni);
  
  h.appendChild(left);
  h.appendChild(del);
  return h;
}

/* --------------------------------------------------------------------------
13. بطاقة الصورة مع المعاينة
-------------------------------------------------------------------------- */
function imageCard(room, img, i) {
  const card = document.createElement('div');
  card.className = 'img-card';
  card.style.cssText = 'transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1);';
  const isPrimary = img.label === 'أساسي';
  
  card.innerHTML = `
    <div class="thumb-wrap" style="position:relative;overflow:hidden;">
      <img src="${img.dataUrl}" alt="صورة ${i + 1}" loading="lazy" style="transition:transform 0.4s ease;">
      <span class="badge-order mono">${i + 1}</span>
      <span class="badge-label ${isPrimary ? 'primary' : 'alt'}">${isPrimary ? 'أساسي' : 'بديل'}</span>
      <div class="img-overlay" style="position:absolute;inset:0;background:rgba(0,0,0,0);display:flex;align-items:center;justify-content:center;transition:all 0.3s;cursor:zoom-in;">
        <span style="color:#fff;font-size:24px;opacity:0;transition:opacity 0.3s;">🔍</span>
      </div>
    </div>
    <div class="pdf-caption" style="display:none;padding:6px 10px;font-size:11px;text-align:center;color:#3d4c5e;border-top:1px solid #e3dcc9;">
      صورة ${i + 1} — ${isPrimary ? 'أساسي' : 'بديل'}
    </div>
    <div class="controls">
      <div class="arrows no-print">
        <button class="btn-icon" data-act="up" aria-label="نقل الصورة للأعلى" title="نقل للأعلى">↑</button>
        <button class="btn-icon" data-act="down" aria-label="نقل الصورة للأسفل" title="نقل للأسفل">↓</button>
      </div>
      <button class="btn-icon no-print" data-act="del" aria-label="حذف الصورة" title="حذف الصورة">🗑️</button>
    </div>
    <div class="controls no-print" style="border-top:none;padding-top:0;">
      <button class="toggle-label-btn" data-act="toggle">تبديل: أساسي / بديل</button>
    </div>`;
  
  const imgEl = card.querySelector('img'),
    ov = card.querySelector('.img-overlay'),
    oi = ov.querySelector('span');
  
  card.querySelector('.thumb-wrap').addEventListener('mouseenter', () => {
    imgEl.style.transform = 'scale(1.08)';
    ov.style.background = 'rgba(0,0,0,0.3)';
    oi.style.opacity = '1';
  });
  
  card.querySelector('.thumb-wrap').addEventListener('mouseleave', () => {
    imgEl.style.transform = 'scale(1)';
    ov.style.background = 'rgba(0,0,0,0)';
    oi.style.opacity = '0';
  });
  
  card.querySelector('.thumb-wrap').addEventListener('click', e => {
    if (!e.target.closest('button')) openLightbox(room.images, i);
  });
  
  card.querySelector('[data-act=up]').onclick = () => {
    if (i > 0) { [room.images[i - 1], room.images[i]] = [room.images[i], room.images[i - 1]]; renderAll(); saveToLocalStorage(); }
  };
  
  card.querySelector('[data-act=down]').onclick = () => {
    if (i < room.images.length - 1) { [room.images[i + 1], room.images[i]] = [room.images[i], room.images[i + 1]]; renderAll(); saveToLocalStorage(); }
  };
  
  card.querySelector('[data-act=del]').onclick = async () => {
    const ok = await showConfirm({ title: 'حذف الصورة؟', message: 'لا يمكن التراجع عن هذا الإجراء.', confirmLabel: 'حذف', icon: '🗑️' });
    if (ok) {
      room.images.splice(i, 1);
      renderAll();
      saveToLocalStorage();
      showToast('تم الحذف', 'info');
    }
  };
  
  card.querySelector('[data-act=toggle]').onclick = () => {
    img.label = isPrimary ? 'بديل' : 'أساسي';
    renderAll();
    saveToLocalStorage();
  };
  
  return card;
}

/* --------------------------------------------------------------------------
14. ضغط ذكي للصور
-------------------------------------------------------------------------- */
function compressImageSmart(file, maxWidth = 1600, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > maxWidth) { h = (h * maxWidth) / w; w = maxWidth; }
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL(file.type === 'image/png' && file.size < 500000 ? 'image/png' : 'image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = ev.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function handleFiles(room, fileList) {
  const files = Array.from(fileList || []).filter(f => f.type.startsWith('image/'));
  if (!files.length) return;

  const progressToast = createProgressToast(`جاري رفع الصور... (0 / ${files.length})`);
  let count = 0;
  for (const file of files) {
    try {
      const d = await compressImageSmart(file, 1600, 0.85);
      room.images.push({ id: newId(), dataUrl: d, label: room.images.length === 0 ? 'أساسي' : 'بديل' });
      count++;
    } catch (e) { }
    progressToast.update(`جاري رفع الصور... (${count} / ${files.length})`);
  }
  progressToast.remove();
  renderAll();
  saveToLocalStorage();
  showToast(`تم رفع ${count} صورة بنجاح`, 'success');
}

function createProgressToast(initialMsg) {
  const stack = document.getElementById('toastStack');
  const t = document.createElement('div');
  t.className = 'toast toast-info';
  t.innerHTML = `<span class="toast-icon">⏳</span><span class="toast-msg">${escapeHtml(initialMsg)}</span>`;
  stack.appendChild(t);
  return {
    update(msg) { const m = t.querySelector('.toast-msg'); if (m) m.textContent = msg; },
    remove() { t.classList.add('toast-out'); setTimeout(() => t.remove(), 260); }
  };
}

function readFileAsDataURL(file) {
  return new Promise((r, e) => {
    const rd = new FileReader();
    rd.onload = ev => r(ev.target.result);
    rd.onerror = e;
    rd.readAsDataURL(file);
  });
}

/* --------------------------------------------------------------------------
15. صفحة الألوان مع البحث
-------------------------------------------------------------------------- */
function renderColorsSheet() {
  const body = document.createElement('div');
  
  const t1 = document.createElement('h3');
  t1.className = 'section-label';
  t1.textContent = 'إضافة لون / دهان جديد';
  body.appendChild(t1);
  
  const ar = document.createElement('div');
  ar.className = 'color-add-row';
  ar.innerHTML = `<div><label class="field-label">اللون</label><input type="color" class="swatch-input" id="newColorHex" value="#a85c3f"></div>
    <div style="flex:1;min-width:180px;"><label class="field-label">اسم / وصف اللون</label><input type="text" id="newColorName" placeholder="مثال: دهان جدران"></div>
    <button class="btn btn-brass" id="addColorBtn">+ إضافة</button>`;
  body.appendChild(ar);
  
  const sr = document.createElement('div');
  sr.style.cssText = 'margin:20px 0 14px;display:flex;gap:10px;align-items:center;';
  sr.innerHTML = `<div style="flex:1;"><label class="field-label">البحث عن لون</label><input type="text" id="colorSearch" placeholder="ابحث بالاسم أو الكود" style="padding:10px 12px;"></div>
    <button class="btn btn-outline" id="clearColorSearch" style="margin-top:20px;">مسح</button>`;
  body.appendChild(sr);
  
  const t2 = document.createElement('h3');
  t2.className = 'section-label';
  t2.style.marginTop = '22px';
  t2.textContent = `الألوان المختارة (${state.colors.length})`;
  body.appendChild(t2);
  
  if (!state.colors.length) {
    const em = document.createElement('div');
    em.className = 'empty-note';
    em.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:48px;height:48px;margin-bottom:12px;opacity:0.4;"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg><br>لا توجد ألوان مضافة بعد.`;
    body.appendChild(em);
  } else {
    const list = document.createElement('div');
    list.className = 'color-list';
    list.id = 'colorList';
    state.colors.forEach((c, i) => list.appendChild(colorCard(c, i)));
    body.appendChild(list);
  }
  
  body.querySelector('#addColorBtn').onclick = () => {
    const hex = body.querySelector('#newColorHex').value;
    const name = body.querySelector('#newColorName').value.trim();
    if (!name) { showToast('اكتب اسم اللون', 'error'); return; }
    state.colors.push({ id: newId(), hex, name, note: '' });
    renderAll();
    saveToLocalStorage();
    showToast('تمت إضافة اللون', 'success');
  };
  
  const si = body.querySelector('#colorSearch');
  const cb = body.querySelector('#clearColorSearch');
  si.oninput = () => filterColors(si.value);
  cb.onclick = () => { si.value = ''; filterColors(''); };
  
  return sheetShell('A-900', 'الألوان والدهانات', 'مرجع الألوان', body);
}

function filterColors(query) {
  const list = document.getElementById('colorList');
  if (!list) return;
  const q = query.toLowerCase().trim();
  list.innerHTML = '';
  state.colors.forEach((c, i) => {
    if (q === '' || c.name.toLowerCase().includes(q) || c.hex.toLowerCase().includes(q))
      list.appendChild(colorCard(c, i));
  });
}

function colorCard(c, i) {
  const card = document.createElement('div');
  card.className = 'color-card';
  card.style.cssText = 'transition:all 0.3s ease;';
  card.innerHTML = `
    <div class="color-swatch-large" style="background:${c.hex};height:140px;position:relative;">
      <div style="position:absolute;bottom:8px;right:8px;background:rgba(255,255,255,0.95);padding:4px 10px;border-radius:4px;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;color:#1c2530;">${c.hex}</div>
    </div>
    <div class="color-fields">
      <input type="text" value="${escapeAttr(c.name)}" placeholder="اسم اللون" style="font-size:15px;font-weight:600;margin-bottom:8px;">
      <div class="color-hex-row">
        <button type="button" class="color-hex mono" onclick="copyHex('${c.hex}',this)" aria-label="نسخ كود اللون ${c.hex}">${c.hex} — انسخ</button>
      </div>
      <textarea placeholder="ملاحظات...">${escapeHtml(c.note)}</textarea>
    </div>
    <button class="delete-btn" onclick="deleteColor(${i})">حذف هذا اللون</button>`;
  card.querySelector('input[type=text]').oninput = e => { c.name = e.target.value; saveToLocalStorage(); };
  card.querySelector('textarea').oninput = e => { c.note = e.target.value; saveToLocalStorage(); };
  return card;
}

function copyHex(hex, el) {
  navigator.clipboard.writeText(hex).then(() => {
    el.classList.add('copied');
    el.textContent = '✓ تم النسخ';
    setTimeout(() => { el.classList.remove('copied'); el.textContent = hex + ' — انسخ'; }, 2000);
  });
}

async function deleteColor(i) {
  const ok = await showConfirm({ title: 'حذف اللون؟', message: 'لا يمكن التراجع عن هذا الإجراء.', confirmLabel: 'حذف', icon: '🎨' });
  if (ok) {
    state.colors.splice(i, 1);
    renderAll();
    saveToLocalStorage();
    showToast('تم الحذف', 'info');
  }
}

/* --------------------------------------------------------------------------
16. صفحة المواد والخامات (مع ربط الغرف ومعاينة الصور)
-------------------------------------------------------------------------- */
function renderMaterialsSheet() {
  const body = document.createElement('div');
  
  const t1 = document.createElement('h3');
  t1.className = 'section-label';
  t1.textContent = 'إضافة مادة / خامة جديدة';
  body.appendChild(t1);
  
  const roomsOpts = state.rooms.map(r => `<option value="${r.id}">${escapeHtml(r.name)}</option>`).join('');
  
  const ar = document.createElement('div');
  ar.className = 'color-add-row';
  ar.style.cssText = 'flex-wrap:wrap;gap:12px;';
  ar.innerHTML = `
    <div style="flex:1;min-width:200px;"><label class="field-label">اسم الخامة</label><input type="text" id="newMatName" placeholder="مثال: سيراميك بورسلان أبيض"></div>
    <div style="flex:1;min-width:150px;"><label class="field-label">نوع الخامة</label><select id="newMatType" style="width:100%;padding:10px 12px;border:1px solid var(--paper-line);border-radius:var(--radius);background:var(--input-bg);font-family:inherit;font-size:14px;"><option value="أرضيات">أرضيات</option><option value="جدران">جدران</option><option value="أسقف">أسقف</option><option value="إكسسوارات">إكسسوارات</option><option value="أثاث">أثاث</option><option value="إضاءة">إضاءة</option><option value="أخرى">أخرى</option></select></div>
    <div style="flex:1;min-width:150px;"><label class="field-label">الغرفة</label><select id="newMatRoom" style="width:100%;padding:10px 12px;border:1px solid var(--paper-line);border-radius:var(--radius);background:var(--input-bg);font-family:inherit;font-size:14px;"><option value="">-- اختر الغرفة --</option>${roomsOpts}</select></div>
    <div style="flex:1;min-width:150px;"><label class="field-label">الكود / الموديل</label><input type="text" id="newMatCode" placeholder="مثال: SK-2024-001"></div>
    <div style="flex:1;min-width:200px;"><label class="field-label">صورة الخامة</label><div id="matImageDropzone" style="border:2px dashed var(--paper-line);border-radius:var(--radius);padding:12px;text-align:center;cursor:pointer;background:var(--empty-bg);transition:all 0.2s;position:relative;"><span id="matImageLabel" style="color:var(--ink-soft);font-size:13px;"> اضغط لاختيار صورة</span><input type="file" id="newMatImage" accept="image/*" style="display:block !important;width:100%;height:100%;opacity:0;position:absolute;top:0;left:0;cursor:pointer;"></div><img id="matImagePreview" style="max-width:100%;max-height:100px;margin-top:8px;border-radius:4px;display:none;border:1px solid var(--paper-line);cursor:pointer;" title="اضغط للمعاينة"></div>
    <button class="btn btn-brass" id="addMatBtn" style="margin-top:20px;">+ إضافة الخامة</button>`;
  body.appendChild(ar);
  
  const fr = document.createElement('div');
  fr.style.cssText = 'margin:20px 0 14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;';
  fr.innerHTML = `
    <div style="flex:1;min-width:200px;"><label class="field-label">البحث</label><input type="text" id="matSearch" placeholder="ابحث بالاسم أو الكود" style="padding:10px 12px;"></div>
    <div style="min-width:150px;"><label class="field-label">تصفية حسب الغرفة</label><select id="matRoomFilter" style="width:100%;padding:10px 12px;border:1px solid var(--paper-line);border-radius:var(--radius);background:var(--input-bg);font-family:inherit;font-size:14px;"><option value="">كل الغرف</option>${roomsOpts}</select></div>
    <button class="btn btn-outline" id="clearMatSearch" style="margin-top:20px;">مسح</button>`;
  body.appendChild(fr);
  
  const t2 = document.createElement('h3');
  t2.className = 'section-label';
  t2.style.marginTop = '22px';
  t2.textContent = `الخامات المختارة (${state.materials.length})`;
  body.appendChild(t2);
  
  if (!state.materials.length) {
    const em = document.createElement('div');
    em.className = 'empty-note';
    em.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:48px;height:48px;margin-bottom:12px;opacity:0.4;"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg><br>لا توجد خامات مضافة بعد.`;
    body.appendChild(em);
  } else {
    const list = document.createElement('div');
    list.className = 'color-list';
    list.id = 'materialList';
    list.style.gridTemplateColumns = 'repeat(auto-fill,minmax(300px,1fr))';
    state.materials.forEach((m, i) => list.appendChild(materialCard(m, i)));
    body.appendChild(list);
  }
  
  const mii = body.querySelector('#newMatImage');
  const mip = body.querySelector('#matImagePreview');
  const mil = body.querySelector('#matImageLabel');
  const mid = body.querySelector('#matImageDropzone');
  
  mid.addEventListener('dragover', e => { e.preventDefault(); mid.style.borderColor = 'var(--brass)'; mid.style.background = 'rgba(184,134,62,0.1)'; });
  mid.addEventListener('dragleave', e => { e.preventDefault(); mid.style.borderColor = 'var(--paper-line)'; mid.style.background = 'var(--empty-bg)'; });
  mid.addEventListener('drop', e => { e.preventDefault(); mid.style.borderColor = 'var(--paper-line)'; mid.style.background = 'var(--empty-bg)'; if (e.dataTransfer.files.length > 0) { mii.files = e.dataTransfer.files; prevMatImg(); } });
  mii.onchange = prevMatImg;
  
  mip.onclick = () => {
    if (mip.src && mip.style.display !== 'none')
      openLightbox([{ dataUrl: mip.src, label: 'معاينة' }], 0);
  };
  
  function prevMatImg() {
    const f = mii.files[0];
    if (f) {
      const r = new FileReader();
      r.onload = e => {
        mip.src = e.target.result;
        mip.style.display = 'block';
        mil.textContent = '✓ ' + f.name;
      };
      r.readAsDataURL(f);
    } else {
      mip.style.display = 'none';
      mil.textContent = ' اضغط لاختيار صورة';
    }
  }
  
  body.querySelector('#addMatBtn').onclick = async () => {
    const name = body.querySelector('#newMatName').value.trim();
    const type = body.querySelector('#newMatType').value;
    const roomId = body.querySelector('#newMatRoom').value;
    const code = body.querySelector('#newMatCode').value.trim();
    const imgF = mii.files[0];
    
    if (!name) { showToast('اكتب اسم الخامة', 'error'); return; }
    
    let imgD = '';
    if (imgF) try { imgD = await compressImageSmart(imgF, 1600, 0.85); } catch (e) { }
    
    state.materials.push({ id: newId(), name, type, roomId, code, image: imgD, note: '' });
    
    body.querySelector('#newMatName').value = '';
    body.querySelector('#newMatCode').value = '';
    body.querySelector('#newMatRoom').value = '';
    mii.value = '';
    mip.style.display = 'none';
    mil.textContent = '📷 اضغط لاختيار صورة';
    
    renderAll();
    saveToLocalStorage();
    showToast('تمت إضافة الخامة', 'success');
  };
  
  const si = body.querySelector('#matSearch');
  const rf = body.querySelector('#matRoomFilter');
  const cb = body.querySelector('#clearMatSearch');
  const af = () => filterMaterials(si.value, rf.value);
  si.oninput = af;
  rf.onchange = af;
  cb.onclick = () => { si.value = ''; rf.value = ''; filterMaterials('', ''); };
  
  return sheetShell('A-950', 'المواد والخامات', 'مرجع الخامات والمواد', body);
}

function filterMaterials(query, roomId = '') {
  const list = document.getElementById('materialList');
  if (!list) return;
  const q = query.toLowerCase().trim();
  list.innerHTML = '';
  state.materials.forEach((m, i) => {
    const match = (q === '' || m.name.toLowerCase().includes(q) || (m.code && m.code.toLowerCase().includes(q)) || m.type.toLowerCase().includes(q)) && (!roomId || m.roomId === roomId);
    if (match) list.appendChild(materialCard(m, i));
  });
}

function materialCard(m, i) {
  const card = document.createElement('div');
  card.className = 'color-card';
  card.style.cssText = 'transition:all 0.3s ease;';
  
  const room = state.rooms.find(r => r.id === m.roomId);
  const rn = room ? escapeHtml(room.name) : 'غير محدد';
  
  const imgH = m.image
    ? `<div style="height:160px;background:#f1ede3;overflow:hidden;position:relative;cursor:pointer;" class="mat-image-preview">
        <img src="${m.image}" style="width:100%;height:100%;object-fit:cover;transition:transform 0.4s ease;" loading="lazy">
        <div style="position:absolute;inset:0;background:rgba(0,0,0,0);display:flex;align-items:center;justify-content:center;transition:all 0.3s;">
          <span style="color:#fff;font-size:24px;opacity:0;transition:opacity 0.3s;">🔍</span>
        </div>
        <div style="position:absolute;top:8px;right:8px;background:var(--brass);color:#241a06;padding:3px 8px;border-radius:3px;font-size:10px;font-weight:700;">${escapeHtml(m.type)}</div>
      </div>`
    : `<div style="height:160px;background:linear-gradient(135deg,#f1ede3,#e3dcc9);display:flex;align-items:center;justify-content:center;position:relative;">
        <span style="font-size:48px;opacity:0.3;">📦</span>
        <div style="position:absolute;top:8px;right:8px;background:var(--brass);color:#241a06;padding:3px 8px;border-radius:3px;font-size:10px;font-weight:700;">${escapeHtml(m.type)}</div>
      </div>`;
  
  card.innerHTML = `
    ${imgH}
    <div class="color-fields">
      <input type="text" value="${escapeAttr(m.name)}" placeholder="اسم الخامة" style="font-size:15px;font-weight:600;margin-bottom:8px;">
      <div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap;">
        <span class="color-hex mono" style="padding:4px 8px;background:var(--paper);border-radius:4px;font-size:11px;">🏠 ${rn}</span>
        ${m.code ? `<span class="color-hex mono" style="padding:4px 8px;background:var(--paper);border-radius:4px;font-size:11px;">${escapeHtml(m.code)}</span>` : ''}
      </div>
      <textarea placeholder="ملاحظات...">${escapeHtml(m.note)}</textarea>
    </div>
    <button class="delete-btn" onclick="deleteMaterial(${i})">حذف هذه الخامة</button>`;
  
  if (m.image) {
    const ip = card.querySelector('.mat-image-preview');
    const ie = ip.querySelector('img');
    const ov = ip.querySelector('div');
    const ic = ov.querySelector('span');
    
    ip.addEventListener('mouseenter', () => { ie.style.transform = 'scale(1.08)'; ov.style.background = 'rgba(0,0,0,0.3)'; ic.style.opacity = '1'; });
    ip.addEventListener('mouseleave', () => { ie.style.transform = 'scale(1)'; ov.style.background = 'rgba(0,0,0,0)'; ic.style.opacity = '0'; });
    ip.addEventListener('click', () => openLightbox([{ dataUrl: m.image, label: m.name }], 0));
  }
  
  card.querySelector('input[type=text]').oninput = e => { m.name = e.target.value; saveToLocalStorage(); };
  card.querySelector('textarea').oninput = e => { m.note = e.target.value; saveToLocalStorage(); };
  return card;
}

async function deleteMaterial(i) {
  const ok = await showConfirm({ title: 'حذف الخامة؟', message: 'لا يمكن التراجع عن هذا الإجراء.', confirmLabel: 'حذف', icon: '📦' });
  if (ok) {
    state.materials.splice(i, 1);
    renderAll();
    saveToLocalStorage();
    showToast('تم الحذف', 'info');
  }
}

/* --------------------------------------------------------------------------
17. صفحة التوقيع
-------------------------------------------------------------------------- */
function renderSignatureSheet() {
  const body = document.createElement('div');
  
  const t1 = document.createElement('h3');
  t1.className = 'section-label';
  t1.textContent = 'ملخص المرجع';
  body.appendChild(t1);
  
  const summary = document.createElement('div');
  summary.className = 'summary-grid';
  const totalImgs = state.rooms.reduce((s, r) => s + r.images.length, 0);
  
  [['عدد الغرف', state.rooms.length], ['إجمالي الصور', totalImgs], ['عدد الألوان', state.colors.length], ['عدد الخامات', state.materials.length]].forEach(([l, n]) => {
    const c = document.createElement('div');
    c.className = 'summary-card';
    c.innerHTML = `<div class="n mono">${n}</div><div class="l">${l}</div>`;
    summary.appendChild(c);
  });
  body.appendChild(summary);
  
  const t2 = document.createElement('h3');
  t2.className = 'section-label';
  t2.textContent = 'اعتماد العميل';
  body.appendChild(t2);
  
  if (state.signature.approved) {
    const stamp = document.createElement('div');
    stamp.className = 'stamp';
    stamp.innerHTML = `✅ تم الاعتماد من <strong>${escapeHtml(state.signature.name || 'العميل')}</strong> بتاريخ ${state.signature.approvedAt}`;
    body.appendChild(stamp);
    
    if (state.signature.dataUrl) {
      const img = document.createElement('img');
      img.src = state.signature.dataUrl;
      img.style.cssText = 'max-width:320px;margin-top:14px;border:1px solid var(--paper-line);';
      body.appendChild(img);
    }
    
    const reopen = document.createElement('button');
    reopen.className = 'btn btn-outline no-print';
    reopen.style.marginTop = '14px';
    reopen.textContent = 'تعديل التوقيع';
    reopen.onclick = () => { state.signature.approved = false; renderAll(); saveToLocalStorage(); };
    body.appendChild(reopen);
  } else {
    const hint = document.createElement('p');
    hint.className = 'top-hint';
    hint.textContent = 'من فضلك اطلب من العميل مراجعة الصور والألوان، ثم التوقيع هنا.';
    body.appendChild(hint);
    
    const cw = document.createElement('div');
    const cl = document.createElement('label');
    cl.className = 'field-label';
    cl.textContent = 'توقيع العميل';
    cw.appendChild(cl);
    
    const canvas = document.createElement('canvas');
    canvas.id = 'sigPad';
    canvas.width = 520;
    canvas.height = 180;
    cw.appendChild(canvas);
    
    const sr = document.createElement('div');
    sr.className = 'sig-row no-print';
    sr.innerHTML = '<button class="btn btn-outline" id="clearSig">مسح التوقيع</button>';
    cw.appendChild(sr);
    body.appendChild(cw);
    
    const fr = document.createElement('div');
    fr.className = 'field-row';
    fr.style.marginTop = '16px';
    fr.innerHTML = '<div class="field"><label class="field-label">اسم العميل</label><input type="text" id="sigName" placeholder="الاسم بالكامل"></div><div class="field"><label class="field-label">التاريخ</label><input type="date" id="sigDate"></div>';
    body.appendChild(fr);
    
    fr.querySelector('#sigName').value = state.signature.name;
    fr.querySelector('#sigDate').value = state.signature.date;
    fr.querySelector('#sigName').oninput = e => state.signature.name = e.target.value;
    fr.querySelector('#sigDate').oninput = e => state.signature.date = e.target.value;
    
    const ab = document.createElement('div');
    ab.className = 'approve-box';
    ab.innerHTML = '<input type="checkbox" id="agreeChk" style="margin-top:3px;"><label for="agreeChk" style="font-size:13.5px;color:var(--ink-soft);">أقرّ بأنني راجعت جميع الصور والألوان وأوافق على اعتمادها.</label>';
    body.appendChild(ab);
    
    const cb = document.createElement('button');
    cb.className = 'btn btn-primary no-print';
    cb.style.marginTop = '14px';
    cb.textContent = '✔ تأكيد الاعتماد والتوقيع';
    cb.onclick = () => {
      if (!body.querySelector('#agreeChk').checked) { showToast('وافق على الإقرار', 'error'); return; }
      if (!body.querySelector('#sigName').value.trim()) { showToast('اكتب اسم العميل', 'error'); return; }
      if (isCanvasBlank(canvas)) { showToast('وقّع في المكان المخصص', 'error'); return; }
      state.signature.name = body.querySelector('#sigName').value.trim();
      state.signature.date = body.querySelector('#sigDate').value || state.signature.date;
      state.signature.dataUrl = canvas.toDataURL('image/png');
      state.signature.approved = true;
      state.signature.approvedAt = new Date().toLocaleDateString('ar-EG');
      renderAll();
      saveToLocalStorage();
      showToast('تم الاعتماد بنجاح', 'success');
    };
    body.appendChild(cb);
    requestAnimationFrame(() => setupSignaturePad(canvas, sr.querySelector('#clearSig')));
  }
  
  return sheetShell('A-999', 'اعتماد التصميم', 'صفحة التوقيع النهائي', body);
}

function isCanvasBlank(c) {
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  for (let i = 3; i < d.length; i += 4) if (d[i] !== 0) return false;
  return true;
}

function setupSignaturePad(canvas, clearBtn) {
  const ctx = canvas.getContext('2d');
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#1c2530';
  let drawing = false, last = null;
  
  function pos(e) {
    const r = canvas.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    return { x: (p.clientX - r.left) * (canvas.width / r.width), y: (p.clientY - r.top) * (canvas.height / r.height) };
  }
  function start(e) { e.preventDefault(); drawing = true; last = pos(e); }
  function move(e) { if (!drawing) return; e.preventDefault(); const p = pos(e); ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke(); last = p; }
  function end() { drawing = false; }
  
  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', move);
  window.addEventListener('mouseup', end);
  canvas.addEventListener('touchstart', start, { passive: false });
  canvas.addEventListener('touchmove', move, { passive: false });
  canvas.addEventListener('touchend', end);
  
  if (clearBtn) clearBtn.onclick = () => ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/* --------------------------------------------------------------------------
18. حفظ / تحميل / تصدير
-------------------------------------------------------------------------- */
document.getElementById('addRoomBtn').onclick = () => {
  const name = prompt('اسم الغرفة الجديدة:', 'غرفة إضافية');
  if (name && name.trim()) {
    const room = mkRoom(name.trim());
    state.rooms.push(room);
    currentTab = room.id;
    renderAll();
    saveToLocalStorage();
    showToast('تمت الإضافة', 'success');
  }
};

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function projectFileBaseName() {
  return (state.project.name || 'مشروع').replace(/[^\w\u0600-\u06FF\- ]/g, '').trim() || 'مشروع';
}

document.getElementById('saveProjectBtn').onclick = () => {
  downloadBlob(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }), projectFileBaseName() + ' - دفتر المرجع.json');
  showToast('تم حفظ نسخة JSON', 'success');
};

/* --- فتح نسخة محفوظة --- */
document.getElementById('loadProjectBtn').onclick = () => {
  document.getElementById('loadInput').click();
};

document.getElementById('loadInput').onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const loaded = JSON.parse(text);
    if (!loaded || typeof loaded !== 'object') throw new Error('ملف غير صالح');

    const ok = await showConfirm({
      title: 'فتح نسخة محفوظة؟',
      message: 'سيتم استبدال بيانات المشروع الحالي بالكامل ببيانات هذا الملف. لا يمكن التراجع عن هذا الإجراء.',
      confirmLabel: 'فتح الملف',
      icon: '📂'
    });
    if (!ok) { e.target.value = ''; return; }

    if (loaded.project) Object.assign(state.project, loaded.project);
    if (Array.isArray(loaded.rooms)) state.rooms = loaded.rooms;
    if (Array.isArray(loaded.colors)) state.colors = loaded.colors;
    if (Array.isArray(loaded.materials)) state.materials = loaded.materials;
    if (loaded.signature) Object.assign(state.signature, loaded.signature);

    currentTab = 'project';
    renderAll();
    saveToLocalStorage();
    showToast('تم فتح المشروع بنجاح', 'success');
  } catch (err) {
    console.error('Load failed:', err);
    showToast('تعذر فتح الملف — تأكد أنه ملف JSON صحيح من شطّب', 'error');
  } finally {
    e.target.value = '';
  }
};

// زر تصدير HTML
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.createElement('button');
  btn.className = 'ghost-btn';
  btn.textContent = '🌐 تصدير كـ HTML مستقل';
  btn.onclick = exportAsStandaloneHTML;
  const sf = document.querySelector('.sidebar-footer');
  if (sf) sf.insertBefore(btn, sf.firstChild);
});

/* ==========================================================================
19. تصدير HTML احترافي مع علامة مائية مزغرفة + فتح صور الخامات
========================================================================== */
function exportAsStandaloneHTML() {
  showLoading('جاري إنشاء ملف HTML الاحترافي...', 'تجميع البيانات وتنسيق الصفحات...');
  try {
    const projectName = state.project.name || 'مشروع بدون اسم';
    const totalImgs = state.rooms.reduce((s, r) => s + r.images.length, 0);
    const genDate = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    const genDateShort = new Date().toISOString().slice(0, 10);
    const docRef = 'DRB-' + genDateShort.replace(/-/g, '') + '-' + String(state.rooms.length).padStart(2, '0');

    function buildWatermarkDataURI() {
      const tile = `
        <svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
          <text x="20" y="200" font-family="Tajawal, Arial, sans-serif" font-size="80" font-weight="900"
                fill="rgba(184,134,62,0.09)" transform="rotate(-30 300 300)" letter-spacing="4">شطّب</text>
          <text x="20" y="400" font-family="Tajawal, Arial, sans-serif" font-size="80" font-weight="900"
                fill="rgba(184,134,62,0.09)" transform="rotate(-30 300 300)" letter-spacing="4">شطّب</text>
          <text x="20" y="600" font-family="Tajawal, Arial, sans-serif" font-size="80" font-weight="900"
                fill="rgba(184,134,62,0.09)" transform="rotate(-30 300 300)" letter-spacing="4">شطّب</text>
        </svg>`;
      return 'data:image/svg+xml;utf8,' + encodeURIComponent(tile);
    }
    const watermarkURI = buildWatermarkDataURI();

    // فهرس مع أيقونات
    const tocLinks = [
      { href: '#project-info', label: 'بيانات المشروع', icon: '📋' },
      ...state.rooms.map((r, idx) => ({ href: '#room-' + idx, label: r.name, icon: '🏠' })),
      ...(state.colors.length ? [{ href: '#colors-sec', label: 'الألوان والدهانات', icon: '🎨' }] : []),
      ...(state.materials.length ? [{ href: '#materials-sec', label: 'المواد والخامات', icon: '🧱' }] : []),
      ...(state.signature.approved ? [{ href: '#signature-sec', label: 'اعتماد التصميم', icon: '✍️' }] : [])
    ];

    const h = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${escapeHtml(projectName)} — شطّب</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
<style>
:root{
  --ink:#1c2530; --ink-soft:#5a6675;
  --brass:#b8863e; --brass-dark:#8a6428; --brass-glow:rgba(184,134,62,.14);
  --paper:#fffdf8; --paper-alt:#f7f4ed; --paper-line:#e3dcc9;
  --green:#6f7a5e; --radius:6px;
  --shadow-sm:0 1px 3px rgba(28,37,48,.07);
  --shadow-md:0 6px 16px rgba(28,37,48,.08);
  --shadow-lg:0 10px 28px rgba(28,37,48,.12);
}
*{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{
  font-family:'Tajawal','Segoe UI',Tahoma,sans-serif;
  background:#f3efe6;
  color:var(--ink); line-height:1.7; min-height:100vh; position:relative;
  -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
  -webkit-tap-highlight-color: rgba(184,134,62,.25);
}
.watermark-layer{
  position:fixed; inset:0; z-index:-1; pointer-events:none;
  background-image:url("${watermarkURI}");
  background-repeat:repeat; background-size:640px 640px; opacity:.6;
}
.wrap{position:relative; max-width:1080px; margin:0 auto; padding:32px 24px 80px;}

/* ---------- تحسين الأزرار للأيفون ---------- */
button, .image-card, .lightbox-nav, .back-to-top, .toc-list a, .toc-float-label, .toc-backdrop, .toc-popup-close {
    cursor: pointer;
    -webkit-tap-highlight-color: rgba(184,134,62,.25);
}
.image-card, .lightbox-nav, .back-to-top, .toc-list a, .toc-float-label, .toc-backdrop, .toc-popup-close {
    touch-action: manipulation;
}

/* ==========================================================================
   نظام الفهرس: مفتاح واحد (checkbox واحد) يتحكم في كل شيء بـ CSS خالص
   بدون أي اعتماد على الجافاسكريبت — يعمل حتى لو JS معطّلة تماماً
   (مثل بعض أوضاع المعاينة السريعة على الآيفون).
   الـ checkbox موجود كأول عنصر داخل body، وكل عناصر التحكم (الزر العائم،
   زر الإغلاق، الخلفية الشفافة) عبارة عن <label for="tocToggle"> فقط.
   ========================================================================== */
.toc-toggle-checkbox {
  position: absolute;
  opacity: 0;
  width: 0; height: 0;
  pointer-events: none;
}

/* ---------- الترويسة ---------- */
.doc-bar{
  display:flex; align-items:center; justify-content:space-between; gap:12px;
  padding:10px 4px 18px; border-bottom:1px solid var(--paper-line); margin-bottom:0;
  font-family:'JetBrains Mono',monospace; font-size:11.5px; color:var(--ink-soft); letter-spacing:.03em;
}
.doc-bar b{ color:var(--brass-dark); font-weight:700; }

.cover{
  background:#1b2a41; color:#f4ecd8; border-radius:var(--radius);
  padding:44px 40px 36px; box-shadow:var(--shadow-md); position:relative;
  border-top:4px solid var(--brass); margin-top:22px;
}
.cover-eyebrow{
  font-size:12px; font-weight:700; letter-spacing:.12em; text-transform:uppercase;
  color:#c9b98a; display:flex; align-items:center; gap:8px;
}
.cover-eyebrow::before{ content:''; width:22px; height:1px; background:var(--brass); display:inline-block; }
.cover h1{
  font-size:clamp(26px,4vw,38px); font-weight:800; margin:14px 0 6px;
  letter-spacing:-0.3px; line-height:1.3; color:#fff;
}
.cover .sub{ color:#c9b98a; font-size:13.5px; }
.cover-meta{
  display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
  gap:1px; margin-top:30px; background:rgba(233,209,159,.18);
  border:1px solid rgba(233,209,159,.18); border-radius:4px; overflow:hidden;
}
.cover-meta .item{ background:rgba(13,19,32,.55); padding:14px 18px; }
.cover-meta .item .l{ font-size:11px; color:#c9b98a; margin-bottom:6px; font-weight:500; }
.cover-meta .item .v{ font-size:16px; font-weight:700; color:#ffffff; }
.cover-status{
  display:inline-flex; align-items:center; gap:6px; margin-top:22px;
  font-size:12px; font-weight:700; padding:6px 14px; border-radius:3px;
  border:1px solid rgba(233,209,159,.3); color:#e9d19f;
}
.cover-status.approved{ border-color:rgba(111,122,94,.6); color:#bcd4a8; }
.cover-note{
  background:rgba(255,253,248,0.1);
  padding:10px 16px;
  border-radius:4px;
  margin-top:18px;
  font-size:13px;
  color:#c9b98a;
  border-right:3px solid var(--brass);
  display:flex;
  align-items:center;
  gap:10px;
}

/* ---------- فهرس المحتويات (لاصق على الديسكتوب) ---------- */
.toc-wrap{
  position: sticky;
  top: 10px;
  z-index: 100;
  background: rgba(255,253,248,0.92);
  padding: 14px 18px;
  border-radius: var(--radius);
  box-shadow: var(--shadow-md);
  margin: 34px 0 16px;
  border: 1px solid var(--paper-line);
  /* ملاحظة: لا نضع backdrop-filter/filter/transform هنا أبداً — أي منهم
     على عنصر أب يحوّل موضع أي عنصر ابن position:fixed بالنسبة له بدل
     الشاشة كلها، وده كان سبب اختفاء القائمة في نسخة سابقة. */
}
.toc-header{
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.toc-title{
  font-family:'JetBrains Mono',monospace; font-size:12px; font-weight:700; color:var(--brass-dark);
  text-transform:uppercase; letter-spacing:.12em;
  margin:0; padding:0; border:none;
}

/* حاوية القائمة على الديسكتوب: كتلة ثابتة الظهور دائماً */
.toc-list-wrap {
  overflow: visible;
  max-height: none;
  opacity: 1;
  margin-top: 12px;
}

.toc-list {
  list-style: none;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 10px;
  padding: 2px 0;
}
.toc-list::-webkit-scrollbar { display: none; }

.toc-list li {
  display: inline-block;
  border: 1px solid var(--paper-line);
  border-radius: var(--radius);
  background: var(--paper);
  transition: all .2s ease;
}
.toc-list li:hover { background: var(--paper-alt); border-color: var(--brass); }
.toc-list li:active { background: var(--paper-alt); }

.toc-list a {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  text-decoration: none;
  color: var(--ink);
  cursor: pointer;
}
.toc-list a .icon { font-size: 18px; line-height: 1; flex-shrink: 0; }
.toc-list a .label { font-size: 14px; font-weight: 600; color: #1b2a41; line-height: 1.3; }
.toc-list a .leader {
  font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--ink-soft);
  background: var(--paper-alt); padding: 2px 6px; border-radius: 12px; flex-shrink: 0;
}

/* رأس البطاقة العائمة (يظهر فقط على الموبايل) */
.toc-popup-header{ display: none; }

/* الخلفية الشفافة التي تقفل القائمة عند الضغط خارجها (تظهر فقط على الموبايل) */
.toc-backdrop{ display: none; }

/* ---------- الزر العائم لفتح القائمة (CSS فقط، ثابت أيًا كان مكان التمرير) ---------- */
.toc-float {
  position: fixed;
  right: 20px;
  bottom: calc(110px + env(safe-area-inset-bottom, 0px));
  left: auto;
  top: auto;
  transform: rotate(-6deg);
  z-index: 9999;
  display: flex;
}
.toc-float-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  background: linear-gradient(155deg, var(--brass) 0%, var(--brass-dark) 100%);
  color: #fff;
  border: none;
  border-radius: 50px;
  padding: 14px 20px;
  font-size: 19px;
  font-family: 'Tajawal', sans-serif;
  font-weight: 700;
  box-shadow: 0 8px 22px rgba(138,100,40,.4), 0 2px 6px rgba(0,0,0,.15);
  cursor: pointer;
  transition: box-shadow .25s ease, transform .25s ease;
  touch-action: manipulation;
  user-select: none;
  min-width: 58px;
  min-height: 58px;
}
.toc-float-label:active { transform: scale(0.94); }
.toc-float-label .hamburger{ position: relative; width: 18px; height: 14px; flex-shrink: 0; }
.toc-float-label .hamburger span{
  position: absolute; left:0; right:0; height:2px; background:#fff; border-radius:2px;
  transition: transform .3s ease, opacity .2s ease, top .3s ease;
}
.toc-float-label .hamburger span:nth-child(1){ top:0; }
.toc-float-label .hamburger span:nth-child(2){ top:6px; }
.toc-float-label .hamburger span:nth-child(3){ top:12px; }
.toc-float-label .badge {
  background: rgba(255,255,255,0.28);
  border-radius: 20px; padding: 1px 10px; font-size: 12.5px; font-weight: 700;
}

/* عند تفعيل الـ checkbox (القائمة مفتوحة): تحويل الهمبرغر لعلامة × */
.toc-toggle-checkbox:checked ~ .toc-float .toc-float-label .hamburger span:nth-child(1){
  top:6px; transform: rotate(45deg);
}
.toc-toggle-checkbox:checked ~ .toc-float .toc-float-label .hamburger span:nth-child(2){
  opacity:0;
}
.toc-toggle-checkbox:checked ~ .toc-float .toc-float-label .hamburger span:nth-child(3){
  top:6px; transform: rotate(-45deg);
}

/* ================================================================
   على الديسكتوب: القائمة مفتوحة ومثبتة دائماً، ونخفي الزر العائم
   ================================================================ */
@media (min-width:769px) {
  .toc-float { display: none !important; }
  .toc-list-wrap { max-height: 80vh; opacity: 1; margin-top: 12px; }
}

/* ================================================================
   على الموبايل: القائمة بطاقة عائمة (Popup) فوق الزر مباشرة،
   لا تدفع ولا تغطي محتوى الصفحة، وتُتحكم بالكامل عبر checkbox واحد
   بدون أي جافاسكريبت.
   ================================================================ */
@media (max-width:768px) {
  .toc-float { display: flex; }

  .toc-wrap{
    position: static;
    background: transparent;
    box-shadow: none;
    border: none;
    padding: 0;
    margin: 0;
  }
  .toc-header{ display: none; }

  .toc-list-wrap{
    position: fixed;
    left: 14px;
    right: 14px;
    bottom: calc(96px + env(safe-area-inset-bottom, 0px));
    top: auto;
    max-height: 0;
    opacity: 0;
    margin: 0;
    padding: 0;
    background: rgba(255,253,248,0.99);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(227,220,201,.9);
    border-radius: 18px;
    box-shadow: 0 20px 50px rgba(28,37,48,.22), 0 4px 14px rgba(28,37,48,.1);
    z-index: 998;
    transform: translateY(14px) scale(.96);
    transform-origin: bottom left;
    transition: max-height .38s cubic-bezier(.22,1,.36,1), opacity .28s ease, transform .32s cubic-bezier(.22,1,.36,1);
    pointer-events: none;
    overflow: hidden;
  }
  .toc-toggle-checkbox:checked ~ .wrap .toc-wrap .toc-list-wrap{
    max-height: 62vh;
    opacity: 1;
    transform: translateY(0) scale(1);
    pointer-events: auto;
    overflow: visible;
  }

  .toc-popup-header{
    display: flex; align-items: center; justify-content: space-between; gap: 10px;
    padding: 14px 16px 12px;
    border-bottom: 1px solid var(--paper-line);
  }
  .toc-popup-header .t{
    display: flex; align-items: center; gap: 8px;
    font-family:'JetBrains Mono',monospace; font-size:11.5px; font-weight:700;
    color:var(--brass-dark); text-transform:uppercase; letter-spacing:.1em;
  }
  .toc-popup-header .t .dot{ width:7px; height:7px; border-radius:50%; background:var(--brass); flex-shrink:0; }
  .toc-popup-close{
    width: 26px; height: 26px; border-radius: 50%;
    background: var(--paper-alt); color: var(--ink-soft);
    display:flex; align-items:center; justify-content:center;
    font-size: 13px; flex-shrink:0;
    transition: background .2s ease;
  }
  .toc-popup-close:active{ background: var(--paper-line); }

  .toc-list{
    grid-template-columns: repeat(2, 1fr);
    display: grid;
    max-height: 48vh;
    overflow-y: auto;
    padding: 10px 12px 14px;
    gap: 6px 8px;
  }
  .toc-list::-webkit-scrollbar{ width: 5px; }
  .toc-list::-webkit-scrollbar-thumb{ background: var(--paper-line); border-radius: 10px; }
  .toc-list a{ padding: 9px 10px; border-radius: 8px; }
  .toc-list a .icon{
    width: 30px; height: 30px; display:flex; align-items:center; justify-content:center;
    background: var(--brass-glow); border-radius: 8px; font-size: 16px;
  }
  .toc-list a .leader{ font-size:10.5px; padding:2px 7px; }

  .toc-backdrop{
    display: block;
    position: fixed;
    inset: 0;
    z-index: 997;
    background: rgba(15,15,15,.22);
    opacity: 0;
    pointer-events: none;
    transition: opacity .3s ease;
  }
  .toc-toggle-checkbox:checked ~ .toc-backdrop{
    opacity: 1;
    pointer-events: auto;
  }
}

@media (max-width:640px){
  .toc-list{ grid-template-columns: repeat(2, 1fr); gap:6px; }
  .toc-list a .label{ font-size:13px; }
  .toc-float-label{ padding:12px 16px; font-size:16px; min-width:52px; min-height:52px; }
}

/* ---------- باقي الأنماط (الأقسام، البطاقات، الخ) ---------- */
.section-block{ margin-top:44px; scroll-margin-top:20px; }
.section-head{
  display:flex; align-items:center; gap:14px; margin-bottom:20px;
  padding-bottom:10px; border-bottom:2px solid #1b2a41;
}
.section-head h2{ font-size:19px; color:#1b2a41; font-weight:800; flex:1; letter-spacing:.01em; }
.section-head .count{
  font-family:'JetBrains Mono',monospace; font-size:12px;
  background:var(--paper-alt); border:1px solid var(--paper-line); padding:4px 12px;
  border-radius:20px; color:var(--ink-soft); font-weight:600;
}
.info-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;}
.info-card{background:var(--paper);padding:18px;border-radius:var(--radius);border:1px solid var(--paper-line);box-shadow:var(--shadow-sm); transition: transform 0.2s ease;}
.info-card:hover{transform: translateY(-2px);}
.info-card .label{font-size:12px;color:var(--ink-soft);margin-bottom:6px;font-weight:600;}
.info-card .value{font-size:18px;font-weight:800;color:#1b2a41;}

.room{
  background:var(--paper); padding:26px; border-radius:var(--radius); margin:20px 0;
  border:1px solid var(--paper-line); box-shadow:var(--shadow-sm); transition: box-shadow 0.3s ease;
}
.room:hover { box-shadow: var(--shadow-md); }
.room-head{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:18px; padding-bottom:14px; border-bottom:1px solid var(--paper-line);}
.room-head h3{font-size:18px;color:#1b2a41;font-weight:800;}
.room-tag{font-family:'JetBrains Mono',monospace;font-size:11px;background:#1b2a41;color:#e9d19f;padding:4px 10px;border-radius:3px;font-weight:700;}
.sub-label{font-size:12.5px;font-weight:700;color:var(--brass-dark);margin:20px 0 12px;text-transform:uppercase;letter-spacing:.08em;}

.images-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;margin:14px 0;}
.image-card{background:#fff;border:1px solid var(--paper-line);border-radius:var(--radius);overflow:hidden;cursor:pointer;transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease;touch-action:manipulation;}
.image-card:hover{transform:translateY(-3px);box-shadow:var(--shadow-md);border-color:var(--brass);}
.image-card .img-wrapper{position:relative;overflow:hidden;height:200px;background:#efe9db;}
.image-card img{width:100%;height:100%;object-fit:cover;transition:transform .5s ease;}
.image-card:hover img{transform:scale(1.05);}
.image-card .overlay{position:absolute;inset:0;background:rgba(20,20,20,0);display:flex;align-items:center;justify-content:center;transition:all .25s;}
.image-card:hover .overlay{background:rgba(15,15,15,.35);}
.image-card .overlay-icon{color:#fff;font-size:28px;opacity:0;transition:opacity .25s;}
.image-card:hover .overlay-icon{opacity:1;}
.image-card .caption{padding:10px 14px;font-size:12.5px;color:var(--ink-soft);border-top:1px solid var(--paper-line);display:flex;justify-content:space-between;font-weight:600;}
.image-badge{position:absolute;top:10px;right:10px;background:var(--brass);color:#241a06;padding:3px 9px;border-radius:3px;font-size:10.5px;font-weight:800;z-index:2;}
.image-badge.alt{background:#e9e3d3;color:var(--ink-soft);}
.notes{background:var(--paper-alt);padding:16px 18px;border-radius:4px;margin:16px 0;white-space:pre-wrap;border-right:3px solid var(--brass);font-size:14px;color:var(--ink);line-height:1.8;}
.empty-note{color:#a89c82;font-size:14px;font-style:italic;padding:14px 0;}

.colors-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;margin:16px 0;}
.color-card{background:#fff;border:1px solid var(--paper-line);border-radius:var(--radius);overflow:hidden;box-shadow:var(--shadow-sm);transition:transform .2s ease,box-shadow .2s ease;}
.color-card:hover{box-shadow:var(--shadow-md);transform:translateY(-2px);}
.color-swatch{height:110px;position:relative;}
.color-swatch .hexlabel{position:absolute;bottom:10px;left:10px;background:rgba(255,255,255,.95);padding:4px 10px;border-radius:3px;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;color:#1c2530;}
.color-info{padding:14px 16px;}
.color-info .name{font-weight:700;margin-bottom:4px;font-size:14.5px;}
.color-info .note{margin-top:8px;font-size:12.5px;color:var(--ink-soft);line-height:1.5;}

.materials-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;margin:16px 0;}
.material-card{background:#fff;border:1px solid var(--paper-line);border-radius:var(--radius);overflow:hidden;box-shadow:var(--shadow-sm);transition:transform .2s ease,box-shadow .2s ease;}
.material-card:hover{box-shadow:var(--shadow-md);transform:translateY(-2px);}
.material-card img{width:100%;height:160px;object-fit:cover;cursor:zoom-in;transition:transform .3s ease;}
.material-card:hover img{transform:scale(1.03);}
.material-noimg{height:160px;background:linear-gradient(135deg,#f1ede3,#e3dcc9);display:flex;align-items:center;justify-content:center;font-size:40px;opacity:.3;}
.material-info{padding:14px 16px;}
.pill{display:inline-block;color:#fff;padding:3px 9px;border-radius:3px;font-size:10.5px;font-weight:700;margin-left:6px;margin-bottom:8px;}
.pill.type{background:var(--brass);}
.pill.room{background:var(--green);}
.material-name{font-weight:700;margin:6px 0 4px;font-size:14.5px;}
.material-code{font-family:'JetBrains Mono',monospace;color:var(--ink-soft);font-size:12px;}

.signature-box{
  background:var(--paper); border:1px solid var(--paper-line);
  padding:26px 28px; border-radius:var(--radius); margin:18px 0;
}
.approval-row{ display:flex; flex-wrap:wrap; gap:24px; margin-bottom:18px; }
.approval-row .field{ flex:1; min-width:180px; }
.approval-row .field .l{ font-size:11.5px; color:var(--ink-soft); text-transform:uppercase; letter-spacing:.06em; margin-bottom:4px; }
.approval-row .field .v{ font-size:15px; font-weight:700; color:#1b2a41; border-bottom:1px solid var(--paper-line); padding-bottom:8px; }
.approval-stamp{
  display:inline-flex; align-items:center; gap:8px; font-weight:700; font-size:13px;
  color:var(--green); border:1px solid #bcd4c1; background:rgba(111,122,94,.08);
  padding:6px 14px; border-radius:3px; margin-bottom:18px;
}
.signature-box img{max-width:280px; display:block; border:1px solid var(--paper-line); border-radius:3px; background:#fff;}
.signature-box .sig-caption{ font-size:11.5px; color:var(--ink-soft); margin-top:6px; border-top:1px dotted var(--paper-line); padding-top:6px; max-width:280px; }

.footer{text-align:center;margin-top:56px;padding-top:24px;border-top:1px solid var(--paper-line);color:#8a8072;font-size:12.5px;}
.footer .brand{font-weight:800;color:var(--brass-dark);font-size:14px;margin-bottom:6px;}
.footer .disclaimer{max-width:520px;margin:8px auto 0;font-size:11.5px;line-height:1.7;color:#a89c82;}

.lightbox{display:none;position:fixed;inset:0;background:rgba(8,10,14,.96);z-index:9700;align-items:center;justify-content:center;backdrop-filter:blur(4px);}
.lightbox.show{display:flex;animation:fadeIn .2s ease;}
.lightbox-stage{width:min(92vw,1100px);height:min(84vh,800px);display:flex;align-items:center;justify-content:center;overflow:hidden;}
.lightbox-stage img{max-width:100%;max-height:100%;object-fit:contain;cursor:zoom-in;user-select:none;transition:transform .2s ease;box-shadow:0 20px 60px rgba(0,0,0,.5);}
.lightbox-close{position:absolute;top:20px;left:20px;width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#fff;font-size:20px;cursor:pointer;transition:all .2s;touch-action:manipulation;}
.lightbox-close:hover{background:rgba(255,255,255,.25);transform:rotate(90deg);}
.lightbox-counter{position:absolute;top:24px;right:24px;color:#e4c893;font-size:13px;background:rgba(255,255,255,.08);padding:6px 14px;border-radius:20px;font-family:'JetBrains Mono',monospace;}
.lightbox-nav{position:absolute;top:50%;transform:translateY(-50%);width:50px;height:50px;border-radius:50%;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#fff;font-size:24px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;touch-action:manipulation;}
.lightbox-nav:hover{background:var(--brass);color:#241a06;border-color:var(--brass);}
.lightbox-prev{right:20px;}
.lightbox-next{left:20px;}

.back-to-top {
  position: fixed;
  bottom: calc(100px + env(safe-area-inset-bottom, 0px));
  left: 30px;
  width: 48px; height: 48px;
  background: var(--brass); color: #fff; border: none; border-radius: 50%;
  font-size: 20px; cursor: pointer; box-shadow: var(--shadow-md);
  opacity: 0; transform: translateY(20px); transition: all 0.3s; z-index: 900;
  touch-action: manipulation;
}
.back-to-top.show { opacity: 1; transform: translateY(0); }
.back-to-top:hover { background: var(--brass-dark); transform: translateY(-3px); }

@keyframes fadeIn { from{opacity:0;} to{opacity:1;} }

@page{ size:A4; margin:16mm 14mm; }
@media print{
  .watermark-layer{ opacity:.35; }
  .toc-wrap, .lightbox, .back-to-top, .cover-note, .toc-float, .toc-backdrop{ display:none !important; }
  .wrap{ padding: 0; max-width: 100%; }
  .room, .info-card, .color-card, .material-card, .signature-box{ box-shadow:none; break-inside:avoid; page-break-inside: avoid; border: 1px solid #ddd; }
  .image-card:hover, .color-card:hover, .material-card:hover{ transform:none; }
  body{ background:#fff; }
  .cover{ -webkit-print-color-adjust: exact; print-color-adjust: exact; break-inside:avoid; }
  .section-block{ break-inside:auto; }
}

@media (max-width:640px){
  .cover{ padding:30px 20px; }
  .wrap{ padding:16px 12px 60px; }
  .images-grid{ grid-template-columns: 1fr; }
  .approval-row{ flex-direction:column; gap:14px; }
  .back-to-top { bottom: calc(90px + env(safe-area-inset-bottom, 0px)); left: 20px; width: 42px; height: 42px; font-size:18px; }
}
</style>
</head>
<body>

<!-- المفتاح الوحيد الذي يتحكم في فتح/غلق الفهرس بالكامل عبر CSS فقط،
     بدون أي اعتماد على الجافاسكريبت. أي label في الصفحة بـ for="tocToggle"
     (الزر العائم، زر الإغلاق، الخلفية) يفتح ويغلق نفس القائمة. -->
<input type="checkbox" id="tocToggle" class="toc-toggle-checkbox">

<noscript>
  <style>
    /* تنبيه بسيط في أعلى الصفحة لو الجافاسكريبت معطّلة (وضع معاينة) */
    .js-note{
      background:#1b2a41; color:#e9d19f; text-align:center; font-size:12.5px;
      padding:8px 14px; position:relative; z-index:2000;
    }
  </style>
  <div class="js-note">⚠️ الجافاسكريبت معطّلة في وضع العرض هذا — فهرس المحتويات يعمل عادي، لكن تكبير الصور يحتاج فتح الملف داخل متصفح Safari مباشرة (مشاركة ← افتح في Safari).</div>
</noscript>

<div class="watermark-layer"></div>
<div class="wrap">

  <div class="doc-bar">
    <span><b>شطّب</b> — دفتر مرجع التصميم</span>
    <span>مرجع الوثيقة: <b>${docRef}</b> · تاريخ الإصدار: ${genDateShort}</span>
  </div>

  <div class="cover">
    <div class="cover-eyebrow">وثيقة مرجعية رسمية — توثيق اختيارات ما قبل التنفيذ</div>
    <h1>${escapeHtml(projectName)}</h1>
    <div class="sub">تم إعداد هذا المستند بتاريخ ${genDate}</div>
    <div class="cover-meta">
      <div class="item"><div class="l">العميل</div><div class="v">${escapeHtml(state.project.client || '—')}</div></div>
      <div class="item"><div class="l">المهندس / المصمم</div><div class="v">${escapeHtml(state.project.engineer || '—')}</div></div>
      <div class="item"><div class="l">عدد الغرف</div><div class="v">${state.rooms.length}</div></div>
      <div class="item"><div class="l">إجمالي الصور</div><div class="v">${totalImgs}</div></div>
    </div>
    <div class="cover-status ${state.signature.approved ? 'approved' : ''}">${state.signature.approved ? '✓ معتمد من العميل' : '● بانتظار الاعتماد'}</div>
    <div class="cover-note">
      <span>💡</span>
      <span>يُرجى فتح هذا الملف باستخدام متصفح ويب (مثل Safari أو Chrome) مباشرة، وليس داخل معاينة الملفات، للحصول على أفضل تجربة عرض وتفاعل.</span>
    </div>
  </div>

  ${tocLinks.length ? `
  <div class="toc-wrap">
    <div class="toc-header">
      <div class="toc-title">فهرس المحتويات</div>
    </div>
    <div class="toc-list-wrap">
      <div class="toc-popup-header">
        <div class="t"><span class="dot"></span>فهرس المحتويات</div>
        <label for="tocToggle" class="toc-popup-close" aria-label="إغلاق">✕</label>
      </div>
      <ul class="toc-list">
        ${tocLinks.map((l, li) => `<li><a href="${l.href}"><span class="icon">${l.icon}</span><span class="label">${escapeHtml(l.label)}</span><span class="leader">${String(li + 1).padStart(2, '0')}</span></a></li>`).join('')}
      </ul>
    </div>
  </div>` : ''}

  <div class="section-block" id="project-info">
    <div class="section-head"><h2>📋 بيانات المشروع</h2></div>
    <div class="info-grid">
      <div class="info-card"><div class="label">اسم المشروع</div><div class="value">${escapeHtml(projectName)}</div></div>
      <div class="info-card"><div class="label">العميل</div><div class="value">${escapeHtml(state.project.client || '-')}</div></div>
      <div class="info-card"><div class="label">المصمم</div><div class="value">${escapeHtml(state.project.engineer || '-')}</div></div>
      <div class="info-card"><div class="label">التاريخ</div><div class="value">${state.project.date || '-'}</div></div>
    </div>
  </div>

  <div class="section-block">
    <div class="section-head"><h2>🏠 الغرف</h2><span class="count">${state.rooms.length} غرفة</span></div>
    ${state.rooms.map((room, idx) => `
      <div class="room" id="room-${idx}">
        <div class="room-head"><h3>${escapeHtml(room.name)}</h3></div>
        ${room.images.length ? `
          <div class="sub-label">الصور المرجعية (${room.images.length})</div>
          <div class="images-grid" data-room="${idx}">
            ${room.images.map((img, i) => `
              <div class="image-card" onclick="openLB(${idx},${i})">
                <div class="img-wrapper">
                  <img src="${img.dataUrl}" loading="lazy" alt="صورة ${i + 1}">
                  <div class="overlay"><span class="overlay-icon">🔍</span></div>
                  <span class="image-badge ${img.label === 'أساسي' ? '' : 'alt'}">${img.label === 'أساسي' ? 'أساسي' : 'بديل'}</span>
                </div>
                <div class="caption"><strong>صورة ${i + 1}</strong></div>
              </div>`).join('')}
          </div>` : `<div class="empty-note">لا توجد صور مرفوعة لهذه الغرفة بعد.</div>`}
        ${room.notes ? `<div class="sub-label">ملاحظات</div><div class="notes">${escapeHtml(room.notes)}</div>` : ''}
      </div>`).join('')}
  </div>

  ${state.colors.length ? `
  <div class="section-block" id="colors-sec">
    <div class="section-head"><h2>🎨 الألوان والدهانات</h2><span class="count">${state.colors.length} لون</span></div>
    <div class="colors-grid">
      ${state.colors.map(c => `
        <div class="color-card">
          <div class="color-swatch" style="background:${c.hex}"><span class="hexlabel">${c.hex}</span></div>
          <div class="color-info">
            <div class="name">${escapeHtml(c.name)}</div>
            ${c.note ? `<div class="note">${escapeHtml(c.note)}</div>` : ''}
          </div>
        </div>`).join('')}
    </div>
  </div>` : ''}

  ${state.materials.length ? `
  <div class="section-block" id="materials-sec">
    <div class="section-head"><h2>🧱 المواد والخامات</h2><span class="count">${state.materials.length} خامة</span></div>
    <div class="materials-grid">
      ${state.materials.map(m => {
        const room = state.rooms.find(r => r.id === m.roomId);
        return `<div class="material-card">
          ${m.image ? `<img src="${m.image}" loading="lazy" alt="${escapeHtml(m.name)}" style="cursor:zoom-in;" onclick="openMaterialLB('${m.image.replace(/'/g, "\\'")}')">` : `<div class="material-noimg">📦</div>`}
          <div class="material-info">
            <span class="pill type">${escapeHtml(m.type)}</span>${room ? `<span class="pill room">${escapeHtml(room.name)}</span>` : ''}
            <div class="material-name">${escapeHtml(m.name)}</div>
            ${m.code ? `<div class="material-code">${escapeHtml(m.code)}</div>` : ''}
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>` : ''}

  ${state.signature.approved ? `
  <div class="section-block" id="signature-sec">
    <div class="section-head"><h2>✍️ اعتماد العميل</h2></div>
    <div class="signature-box">
      <div class="approval-stamp">✓ معتمد رسمياً</div>
      <div class="approval-row">
        <div class="field"><div class="l">تم الاعتماد من</div><div class="v">${escapeHtml(state.signature.name)}</div></div>
        <div class="field"><div class="l">تاريخ الاعتماد</div><div class="v">${state.signature.approvedAt}</div></div>
      </div>
      ${state.signature.dataUrl ? `<img src="${state.signature.dataUrl}" alt="توقيع العميل"><div class="sig-caption">توقيع العميل</div>` : ''}
    </div>
  </div>` : ''}

  <div class="footer">
    <p class="brand">شطّب</p>
    <p>دفتر مرجع التصميم — تم الإنشاء بتاريخ ${genDate} — مرجع الوثيقة ${docRef}</p>
    <p class="disclaimer">هذا المستند مُعد لأغراض التوثيق الداخلي بين طرفي المشروع، ويُعتبر مرجعاً لاختيارات التشطيب المتفق عليها قبل بدء التنفيذ.</p>
  </div>
</div>

<!-- خلفية شفافة تقفل القائمة عند الضغط خارجها (CSS فقط، تظهر على الموبايل فقط) -->
<label for="tocToggle" class="toc-backdrop"></label>

<!-- زر عائم لفتح/غلق الفهرس (CSS فقط عبر label، يظهر فقط على الموبايل) -->
<div class="toc-float">
  <label for="tocToggle" class="toc-float-label">
    <span class="hamburger"><span></span><span></span><span></span></span>
    
  </label>
</div>

<button class="back-to-top" id="htmlBackToTop" onclick="window.scrollTo({top:0,behavior:'smooth'})" title="العودة للأعلى">↑</button>

<div class="lightbox" id="lb">
  <button class="lightbox-close" onclick="closeLB()" aria-label="إغلاق">✕</button>
  <div class="lightbox-counter" id="lbc" style="display:none;">1/1</div>
  <button class="lightbox-nav lightbox-prev" onclick="prevImg()" aria-label="السابق">‹</button>
  <div class="lightbox-stage"><img id="lbi" alt="معاينة الصورة"></div>
  <button class="lightbox-nav lightbox-next" onclick="nextImg()" aria-label="التالي">›</button>
</div>

<script>
const R = ${JSON.stringify(state.rooms.map(r => r.images.map(i => i.dataUrl)))};
let ci = 0, ii = 0, lbScale = 1;

function openLB(r, i) {
  ci = r; ii = i; lbScale = 1;
  const img = document.getElementById('lbi');
  img.src = R[r][i];
  img.style.transform = 'scale(1)';
  document.getElementById('lbc').style.display = 'block';
  document.getElementById('lbc').textContent = (i + 1) + ' / ' + R[r].length;
  document.getElementById('lb').classList.add('show');
  document.body.style.overflow = 'hidden';
}

function openMaterialLB(url) {
  lbScale = 1;
  const img = document.getElementById('lbi');
  img.src = url;
  img.style.transform = 'scale(1)';
  document.getElementById('lbc').style.display = 'none';
  document.getElementById('lb').classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeLB() {
  document.getElementById('lb').classList.remove('show');
  document.body.style.overflow = '';
}

function nextImg() {
  if (!R[ci] || !R[ci].length) return;
  ii = (ii + 1) % R[ci].length; lbScale = 1;
  document.getElementById('lbi').src = R[ci][ii];
  document.getElementById('lbi').style.transform = 'scale(1)';
  document.getElementById('lbc').textContent = (ii + 1) + '/' + R[ci].length;
}

function prevImg() {
  if (!R[ci] || !R[ci].length) return;
  ii = (ii - 1 + R[ci].length) % R[ci].length; lbScale = 1;
  document.getElementById('lbi').src = R[ci][ii];
  document.getElementById('lbi').style.transform = 'scale(1)';
  document.getElementById('lbc').textContent = (ii + 1) + '/' + R[ci].length;
}

document.getElementById('lb').addEventListener('click', function(e) {
  if (e.target === this) closeLB();
});

document.getElementById('lbi').addEventListener('click', function() {
  if (lbScale === 1) {
    lbScale = 2.2;
    this.style.transform = 'scale(2.2)';
  } else {
    lbScale = 1;
    this.style.transform = 'scale(1)';
  }
});

window.addEventListener('scroll', function() {
  const btn = document.getElementById('htmlBackToTop');
  if (window.scrollY > 400) btn.classList.add('show');
  else btn.classList.remove('show');
}, { passive: true });

document.addEventListener('keydown', e => {
  if (!document.getElementById('lb').classList.contains('show')) return;
  if (e.key === 'Escape') closeLB();
  else if (e.key === 'ArrowRight') prevImg();
  else if (e.key === 'ArrowLeft') nextImg();
});

document.addEventListener('touchstart', function(){}, { passive: true });

// تحسين اختياري فقط (ليس ضرورياً): إغلاق القائمة تلقائياً بعد اختيار رابط
// على الموبايل. القائمة نفسها تعمل بالكامل بدون هذا الكود.
document.addEventListener('DOMContentLoaded', function() {
  const tocToggle = document.getElementById('tocToggle');
  const tocLinksEls = document.querySelectorAll('.toc-list a');
  if (tocToggle && tocLinksEls.length) {
    tocLinksEls.forEach(a => {
      a.addEventListener('click', function() {
        if (window.innerWidth <= 768) tocToggle.checked = false;
      });
    });
  }
});
</script>
</body>
</html>`;

    downloadBlob(new Blob([h], { type: 'text/html;charset=utf-8' }), projectFileBaseName() + ' - شطّب.html');
    hideLoading();
    showToast('تم تصدير HTML بتصميم احترافي فاخر', 'success');
  } catch (err) {
    hideLoading();
    console.error(err);
    showToast('خطأ: ' + err.message, 'error');
  }
}

/* --------------------------------------------------------------------------
20. شاشة التحميل
-------------------------------------------------------------------------- */
function showLoading(t, p) {
  const o = document.getElementById('loadingOverlay');
  if (!o) return;
  document.getElementById('loadingText').textContent = t || 'جاري الإنشاء...';
  document.getElementById('loadingProgress').textContent = p || '';
  o.classList.remove('hidden');
}

function updateLoading(t, p) {
  const te = document.getElementById('loadingText');
  const pe = document.getElementById('loadingProgress');
  if (t && te) te.textContent = t;
  if (p && pe) pe.textContent = p;
}

function hideLoading() {
  const o = document.getElementById('loadingOverlay');
  if (o) o.classList.add('hidden');
}

/* --------------------------------------------------------------------------
21. دوال مساعدة
-------------------------------------------------------------------------- */
function escapeHtml(s) {
  if (!s) return '';
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, '&quot;');
}

/* --------------------------------------------------------------------------
22. القائمة المنسدلة (Drawer)
-------------------------------------------------------------------------- */
const sidebarEl = document.getElementById('sidebar');
const drawerOverlay = document.getElementById('drawerOverlay');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');

function openDrawer() {
  sidebarEl.classList.add('open');
  drawerOverlay.classList.add('show');
  mobileMenuBtn.classList.add('open');
  mobileMenuBtn.setAttribute('aria-expanded', 'true');
}

function closeDrawer() {
  sidebarEl.classList.remove('open');
  drawerOverlay.classList.remove('show');
  mobileMenuBtn.classList.remove('open');
  mobileMenuBtn.setAttribute('aria-expanded', 'false');
}

mobileMenuBtn.onclick = () => sidebarEl.classList.contains('open') ? closeDrawer() : openDrawer();
drawerOverlay.onclick = closeDrawer;
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });

/* --------------------------------------------------------------------------
23. زر العودة للأعلى
-------------------------------------------------------------------------- */
const backToTopBtn = document.getElementById('backToTop');
window.addEventListener('scroll', () => backToTopBtn.classList.toggle('show', window.scrollY > 320));
backToTopBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });

/* --------------------------------------------------------------------------
24. تأثير النقر (Ripple)
-------------------------------------------------------------------------- */
document.addEventListener('click', e => {
  const t = e.target.closest('.btn,.nav-item,.btn-icon,.ghost-btn');
  if (!t) return;
  const r = t.getBoundingClientRect();
  const sz = Math.max(r.width, r.height);
  const rp = document.createElement('span');
  rp.className = 'ripple';
  rp.style.cssText = `width:${sz}px;height:${sz}px;left:${e.clientX - r.left - sz / 2}px;top:${e.clientY - r.top - sz / 2}px;`;
  t.appendChild(rp);
  setTimeout(() => rp.remove(), 600);
});

/* --------------------------------------------------------------------------
25. الإشعارات (Toasts)
-------------------------------------------------------------------------- */
function showToast(msg, type) {
  const stack = document.getElementById('toastStack');
  const t = document.createElement('div');
  t.className = 'toast' + (type ? ' toast-' + type : '');
  const icon = type === 'error' ? '⚠' : (type === 'info' ? 'ℹ' : '✓');
  t.innerHTML = `<span class="toast-icon">${icon}</span><span>${escapeHtml(msg)}</span>`;
  stack.appendChild(t);
  setTimeout(() => { t.classList.add('toast-out'); setTimeout(() => t.remove(), 260); }, 3200);
}

/* --------------------------------------------------------------------------
26. نافذة التأكيد
-------------------------------------------------------------------------- */
function showConfirm({ title, message, confirmLabel, icon }) {
  return new Promise(resolve => {
    const ov = document.getElementById('confirmOverlay');
    document.getElementById('confirmIcon').textContent = icon || '';
    document.getElementById('confirmTitle').textContent = title || 'هل أنت متأكد؟';
    document.getElementById('confirmMsg').textContent = message || '';
    const ok = document.getElementById('confirmOkBtn');
    const cancel = document.getElementById('confirmCancelBtn');
    ok.textContent = confirmLabel || 'تأكيد';
    ov.classList.add('show');
    
    function cleanup(r) {
      ov.classList.remove('show');
      ok.onclick = null;
      cancel.onclick = null;
      ov.onclick = null;
      document.removeEventListener('keydown', esc);
      resolve(r);
    }
    function esc(e) { if (e.key === 'Escape') cleanup(false); }
    
    ok.onclick = () => cleanup(true);
    cancel.onclick = () => cleanup(false);
    ov.onclick = e => { if (e.target === ov) cleanup(false); };
    document.addEventListener('keydown', esc);
    cancel.focus();
  });
}

/* --------------------------------------------------------------------------
27. معرض الصور (Lightbox)
-------------------------------------------------------------------------- */
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
let lbImages = [], lbIndex = 0, lbScale = 1, lbPan = { x: 0, y: 0 }, lbDragging = false, lbDragStart = null;

function openLightbox(images, index) {
  lbImages = images;
  lbIndex = index;
  lightbox.classList.add('show');
  document.body.style.overflow = 'hidden';
  renderLB();
}

function closeLB() {
  lightbox.classList.remove('show');
  document.body.style.overflow = '';
}

function renderLB() {
  lbScale = 1;
  lbPan = { x: 0, y: 0 };
  lightboxImg.style.transform = 'translate(0,0) scale(1)';
  lightboxImg.classList.remove('zoomed');
  lightboxImg.src = lbImages[lbIndex].dataUrl;
  document.getElementById('lightboxCounter').textContent = (lbIndex + 1) + ' / ' + lbImages.length;
  document.getElementById('lightboxPrev').disabled = lbImages.length <= 1;
  document.getElementById('lightboxNext').disabled = lbImages.length <= 1;
}

function lbNext() {
  if (lbImages.length < 2) return;
  lbIndex = (lbIndex + 1) % lbImages.length;
  renderLB();
}

function lbPrev() {
  if (lbImages.length < 2) return;
  lbIndex = (lbIndex - 1 + lbImages.length) % lbImages.length;
  renderLB();
}

lightboxImg.addEventListener('click', () => {
  if (lbScale === 1) { lbScale = 2.2; } else { lbScale = 1; lbPan = { x: 0, y: 0 }; }
  lightboxImg.style.transform = `translate(${lbPan.x}px,${lbPan.y}px) scale(${lbScale})`;
  lightboxImg.classList.toggle('zoomed', lbScale > 1);
});

lightboxImg.addEventListener('mousedown', e => {
  if (lbScale === 1) return;
  lbDragging = true;
  lbDragStart = { x: e.clientX - lbPan.x, y: e.clientY - lbPan.y };
});

window.addEventListener('mousemove', e => {
  if (!lbDragging) return;
  lbPan = { x: e.clientX - lbDragStart.x, y: e.clientY - lbDragStart.y };
  lightboxImg.style.transform = `translate(${lbPan.x}px,${lbPan.y}px) scale(${lbScale})`;
});

window.addEventListener('mouseup', () => { lbDragging = false; });

document.getElementById('lightboxClose').onclick = closeLB;
document.getElementById('lightboxNext').onclick = lbNext;
document.getElementById('lightboxPrev').onclick = lbPrev;
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLB(); });
document.addEventListener('keydown', e => {
  if (!lightbox.classList.contains('show')) return;
  if (e.key === 'Escape') closeLB();
  else if (e.key === 'ArrowRight') lbPrev();
  else if (e.key === 'ArrowLeft') lbNext();
});

/* --------------------------------------------------------------------------
28. بدء التطبيق
-------------------------------------------------------------------------- */
renderAll();