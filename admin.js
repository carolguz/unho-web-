// ══════════════════════════════════════════════
//  UNHO Admin Panel — conectado a la hoja de Google
//  El admin ESCRIBE y ELIMINA filas en la hoja a traves
//  del puente de Apps Script. La pagina publica lee la hoja.
// ══════════════════════════════════════════════

const UNHO = {

  // ── CONFIGURACION (lo unico que podrias cambiar) ──
  SCRIPT_URL: "https://script.google.com/macros/s/AKfycbxGNkflz8A94WYqhvzGtcskR1T8Kx-oZWhX6gHXXjOuUJHw5VE0wuyLX-_BNuryYS8RNw/exec",
  SHEET_ID: "1Js6x9ChrZG_FscvU3sODHmIAU5-2scYWF3JX9u2dad8",

  // ── Credenciales del panel ──
  credentials: { user: 'admin', pass: 'unho2025' },

  state: { isLoggedIn: false, currentPanel: 'inicio' },
  cache: {},

  init() { this.bindLogin(); },

  // ════════════════════════════════  LOGIN  ════════════════════════════════
  bindLogin() {
    const pass = document.getElementById('loginPass');
    if (pass) pass.addEventListener('keydown', e => { if (e.key === 'Enter') this.login(); });
  },

  login() {
    const u = document.getElementById('loginUser').value.trim();
    const p = document.getElementById('loginPass').value.trim();
    const err = document.getElementById('loginErr');
    if (u === this.credentials.user && p === this.credentials.pass) {
      document.getElementById('loginScreen').style.display = 'none';
      document.getElementById('dashboard').style.display = 'block';
      this.state.isLoggedIn = true;
      this.showPanel('inicio');
    } else {
      if (err) { err.style.display = 'block'; setTimeout(() => err.style.display = 'none', 3500); }
    }
  },

  logout() {
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('loginUser').value = '';
    document.getElementById('loginPass').value = '';
    this.state.isLoggedIn = false;
  },

  // ════════════════════════════════  NAVEGACION  ════════════════════════════════
  showPanel(name) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.sb-btn').forEach(b => b.classList.remove('active'));
    const panel = document.getElementById('panel-' + name);
    const btn = document.getElementById('sbtn-' + name);
    if (panel) panel.classList.add('active');
    if (btn) btn.classList.add('active');
    this.state.currentPanel = name;

    if (name === 'noticias')   this.renderNoticias();
    if (name === 'proyectos')  this.renderProyectos();
    if (name === 'empleos')    this.renderEmpleos();
    if (name === 'equipo')     this.renderEquipo();
    if (name === 'galeria')    this.renderGaleria();
    if (name === 'participa')  this.renderParticipa();
  },

  // ════════════════════════════════  HOJA  ════════════════════════════════
  csvUrl(tab) {
    return "https://docs.google.com/spreadsheets/d/" + this.SHEET_ID +
           "/export?format=csv&sheet=" + encodeURIComponent(tab) + "&_=" + Date.now();
  },

  parseCSV(text) {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map(h => h.replace(/^"|"$/g, "").trim());
    return lines.slice(1).map(line => {
      const values = []; let cur = "", inQ = false;
      for (let c of line) {
        if (c === '"') { inQ = !inQ; }
        else if (c === "," && !inQ) { values.push(cur.trim()); cur = ""; }
        else { cur += c; }
      }
      values.push(cur.trim());
      const obj = {};
      headers.forEach((h, i) => { obj[h] = (values[i] || "").replace(/^"|"$/g, ""); });
      return obj;
    });
  },

  async leerTab(tab) {
    try {
      const r = await fetch(this.csvUrl(tab), { cache: "no-store" });
      const text = await r.text();
      return this.parseCSV(text);
    } catch (e) { console.warn("Error leyendo " + tab, e); return []; }
  },

  async enviar(payload) {
    try {
      const r = await fetch(this.SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        redirect: "follow"
      });
      try { return await r.json(); } catch (e) { return { ok: true }; }
    } catch (e) {
      console.warn("Aviso al enviar:", e);
      return { ok: true, aviso: true };
    }
  },

  agregar(pestana, fila) { return this.enviar({ accion: "agregar", pestana, fila }); },
  eliminar(pestana, indice) { return this.enviar({ accion: "eliminar", pestana, indice }); },

  driveImg(value, width) {
    if (!value) return "";
    value = ("" + value).trim();
    width = width || 400;
    if (/^https?:\/\//i.test(value) && !/(drive|docs)\.google\.com|googleusercontent/i.test(value)) return value;
    if (/googleusercontent\.com/i.test(value)) return value;
    let id = value, m = value.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (m) id = m[1]; else { m = value.match(/[?&]id=([a-zA-Z0-9_-]+)/); if (m) id = m[1]; }
    if (/^https?:\/\//i.test(id)) return value;
    return "https://lh3.googleusercontent.com/d/" + id + "=w" + width;
  },

  cargando(list) { if (list) list.innerHTML = '<p style="color:var(--gray);font-size:13px;padding:1rem 0;">Cargando desde la hoja...</p>'; },
  vacio(list, txt) { if (list) list.innerHTML = '<p style="color:var(--gray);font-size:13px;padding:1rem 0;">' + txt + '</p>'; },

  showMsg(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 3000);
  },

  val(id) { const el = document.getElementById(id); return el ? ('' + el.value).trim() : ''; },
  clear(ids) { ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; }); },

  // ════════════════════════════════  NOTICIAS  ════════════════════════════════
  async renderNoticias() {
    const list = document.getElementById('list-noticias-admin');
    if (!list) return;
    this.cargando(list);
    const rows = await this.leerTab('Noticias');
    this.cache.Noticias = rows;
    if (rows.length === 0) { this.vacio(list, 'Sin noticias en la hoja aun.'); return; }
    list.innerHTML = '';
    rows.forEach((n, i) => {
      const src = this.driveImg(n.imagenUrl, 120);
      const item = document.createElement('div');
      item.className = 'li-item';
      item.style.cssText = 'gap:14px;align-items:flex-start;';
      item.innerHTML =
        '<div style="width:70px;height:56px;border-radius:8px;overflow:hidden;background:#f0f0f0;flex-shrink:0;">' +
        (src ? '<img src="' + src + '" style="width:100%;height:100%;object-fit:cover;">' : '') + '</div>' +
        '<div style="flex:1;"><h4>' + (n.titulo || '(sin titulo)') + '</h4><p>' + (n.fecha || '') + '</p></div>' +
        '<div class="li-actions"><button class="btn-del" onclick="UNHO.deleteNoticia(' + i + ')">Eliminar</button></div>';
      list.appendChild(item);
    });
  },

  async addNoticia() {
    const b = this._lock();
    const titulo = this.val('inp-not-titulo');
    if (!titulo) { this._unlock(b); alert('Ingresa el titulo de la noticia'); return; }
    let fecha = this.val('inp-not-fecha');
    if (fecha) {
      const d = new Date(fecha + 'T12:00:00');
      if (!isNaN(d)) fecha = d.toLocaleDateString('es-GT', { day:'numeric', month:'short', year:'numeric' }).toUpperCase();
    }
    const fila = {
      titulo: titulo, fecha: fecha,
      texto: this.val('inp-not-texto'),
      link: this.val('inp-not-link'),
      imagenUrl: this.val('inp-not-imgurl') || this.val('inp-not-drive')
    };
    const res = await this.agregar('Noticias', fila);
    this._unlock(b);
    if (res && res.ok === false) { alert('Error: ' + res.error); return; }
    this.clear(['inp-not-titulo','inp-not-fecha','inp-not-texto','inp-not-link','inp-not-imgurl','inp-not-drive']);
    const prev = document.getElementById('not-foto-preview'); if (prev) prev.style.display = 'none';
    this.showMsg('msg-noticias');
    setTimeout(() => this.renderNoticias(), 1200);
  },

  async deleteNoticia(i) {
    if (!confirm('Eliminar esta noticia de la hoja?')) return;
    await this.eliminar('Noticias', i);
    setTimeout(() => this.renderNoticias(), 1200);
  },

  previewNotFoto() {
    const v = this.val('inp-not-drive') || this.val('inp-not-imgurl');
    if (!v) { alert('Pega el enlace o ID de Drive'); return; }
    const img = document.getElementById('not-prev-img');
    const box = document.getElementById('not-foto-preview');
    if (img) img.src = this.driveImg(v, 400);
    if (box) box.style.display = 'block';
  },

  // ════════════════════════════════  PROYECTOS  ════════════════════════════════
  async renderProyectos() {
    const list = document.getElementById('list-proyectos');
    if (!list) return;
    this.cargando(list);
    const rows = await this.leerTab('proyectos');
    this.cache.proyectos = rows;
    if (rows.length === 0) { this.vacio(list, 'Sin proyectos en la hoja aun.'); return; }
    list.innerHTML = '';
    rows.forEach((p, i) => {
      const src = this.driveImg(p.imagenUrl, 120);
      const item = document.createElement('div');
      item.className = 'li-item';
      item.style.cssText = 'align-items:flex-start;gap:14px;';
      item.innerHTML =
        '<div style="width:70px;height:56px;border-radius:8px;overflow:hidden;background:#f0f0f0;flex-shrink:0;">' +
        (src ? '<img src="' + src + '" style="width:100%;height:100%;object-fit:cover;">' : '') + '</div>' +
        '<div style="flex:1;"><h4>' + (p.titulo || '(sin titulo)') + '</h4><p>' + (p.categoria || '') + '</p></div>' +
        '<div class="li-actions"><button class="btn-del" onclick="UNHO.deleteProyecto(' + i + ')">Eliminar</button></div>';
      list.appendChild(item);
    });
  },

  async addProyecto() {
    const b = this._lock();
    const titulo = this.val('inp-proy-titulo');
    if (!titulo) { this._unlock(b); alert('Ingresa el nombre del proyecto'); return; }
    const fila = {
      titulo: titulo,
      categoria: this.val('inp-proy-cat'),
      descripcion: this.val('inp-proy-desc'),
      link: this.val('inp-proy-link'),
      imagenUrl: this.val('inp-proy-drive')
    };
    const res = await this.agregar('proyectos', fila);
    this._unlock(b);
    if (res && res.ok === false) { alert('Error: ' + res.error); return; }
    this.clear(['inp-proy-titulo','inp-proy-desc','inp-proy-link','inp-proy-drive']);
    const prev = document.getElementById('proy-foto-preview'); if (prev) prev.style.display = 'none';
    this.showMsg('msg-proyectos');
    setTimeout(() => this.renderProyectos(), 1200);
  },

  async deleteProyecto(i) {
    if (!confirm('Eliminar este proyecto de la hoja?')) return;
    await this.eliminar('proyectos', i);
    setTimeout(() => this.renderProyectos(), 1200);
  },

  previewProyFoto() {
    const v = this.val('inp-proy-drive');
    if (!v) { alert('Pega el enlace o ID de Drive'); return; }
    const img = document.getElementById('proy-prev-img');
    const box = document.getElementById('proy-foto-preview');
    if (img) img.src = this.driveImg(v, 400);
    if (box) box.style.display = 'flex';
  },

  // ════════════════════════════════  EMPLEOS  ════════════════════════════════
  async renderEmpleos() {
    const list = document.getElementById('list-empleos');
    if (!list) return;
    this.cargando(list);
    const rows = await this.leerTab('Empleos');
    this.cache.Empleos = rows;
    if (rows.length === 0) { this.vacio(list, 'Sin vacantes en la hoja aun.'); return; }
    list.innerHTML = rows.map((e, i) =>
      '<div class="li-item">' +
        '<div style="flex:1;"><h4>' + (e.puesto || '(sin puesto)') + '</h4><p>' +
        [e.ubicacion, e.duracion].filter(Boolean).join(' · ') + '</p></div>' +
        '<div class="li-actions"><button class="btn-del" onclick="UNHO.deleteEmpleo(' + i + ')">Eliminar</button></div>' +
      '</div>').join('');
  },

  async addEmpleo() {
    const b = this._lock();
    const puesto = this.val('inp-emp-puesto');
    if (!puesto) { this._unlock(b); alert('Ingresa el nombre del puesto'); return; }
    const fila = {
      puesto: puesto,
      duracion: this.val('inp-emp-duracion'),
      ubicacion: this.val('inp-emp-ubicacion'),
      descripcion: this.val('inp-emp-desc'),
      requisitos: this.val('inp-emp-req'),
      pdfUrl: this.val('inp-emp-pdfurl') || this.val('inp-emp-driveid')
    };
    const res = await this.agregar('Empleos', fila);
    this._unlock(b);
    if (res && res.ok === false) { alert('Error: ' + res.error); return; }
    this.clear(['inp-emp-puesto','inp-emp-duracion','inp-emp-ubicacion','inp-emp-desc','inp-emp-req','inp-emp-pdfurl','inp-emp-driveid']);
    this.showMsg('msg-empleos');
    setTimeout(() => this.renderEmpleos(), 1200);
  },

  async deleteEmpleo(i) {
    if (!confirm('Eliminar esta vacante de la hoja?')) return;
    await this.eliminar('Empleos', i);
    setTimeout(() => this.renderEmpleos(), 1200);
  },

  // ════════════════════════════════  EQUIPO  ════════════════════════════════
  async renderEquipo() {
    const list = document.getElementById('list-equipo');
    if (!list) return;
    this.cargando(list);
    const rows = await this.leerTab('Equipo');
    this.cache.Equipo = rows;
    if (rows.length === 0) { this.vacio(list, 'Sin integrantes en la hoja aun.'); return; }
    list.innerHTML = '';
    rows.forEach((m, i) => {
      const src = this.driveImg(m.imagenUrl, 120);
      const item = document.createElement('div');
      item.className = 'li-item';
      item.style.cssText = 'gap:14px;';
      item.innerHTML =
        (src ? '<img src="' + src + '" style="width:50px;height:50px;border-radius:50%;object-fit:cover;flex-shrink:0;">'
             : '<div style="width:50px;height:50px;border-radius:50%;background:#f0f0f0;flex-shrink:0;"></div>') +
        '<div style="flex:1;"><h4>' + (m.nombre || '(sin nombre)') + '</h4><p>' + (m.cargo || '') + '</p></div>' +
        '<div class="li-actions"><button class="btn-del" onclick="UNHO.deleteEquipo(' + i + ')">Eliminar</button></div>';
      list.appendChild(item);
    });
  },

  async addEquipo() {
    const b = this._lock();
    const nombre = this.val('inp-eq-nombre');
    if (!nombre) { this._unlock(b); alert('Ingresa el nombre'); return; }
    const fila = {
      nombre: nombre,
      cargo: this.val('inp-eq-cargo'),
      descripcion: this.val('inp-eq-desc'),
      imagenUrl: this.val('inp-eq-drive')
    };
    const res = await this.agregar('Equipo', fila);
    this._unlock(b);
    if (res && res.ok === false) { alert('Error: ' + res.error); return; }
    this.clear(['inp-eq-nombre','inp-eq-cargo','inp-eq-desc','inp-eq-drive']);
    const prev = document.getElementById('eq-foto-preview'); if (prev) prev.style.display = 'none';
    this.showMsg('msg-equipo');
    setTimeout(() => this.renderEquipo(), 1200);
  },

  async deleteEquipo(i) {
    if (!confirm('Eliminar este integrante de la hoja?')) return;
    await this.eliminar('Equipo', i);
    setTimeout(() => this.renderEquipo(), 1200);
  },

  previewEqFoto() {
    const v = this.val('inp-eq-drive');
    if (!v) { alert('Pega el enlace o ID de Drive'); return; }
    const img = document.getElementById('eq-prev-img');
    const box = document.getElementById('eq-foto-preview');
    if (img) img.src = this.driveImg(v, 400);
    if (box) box.style.display = 'flex';
  },

  // ════════════════════════════════  GALERIA  ════════════════════════════════
  async renderGaleria() {
    const list = document.getElementById('list-galeria');
    if (!list) return;
    this.cargando(list);
    const rows = await this.leerTab('Galeria');
    this.cache.Galeria = rows;
    if (rows.length === 0) { this.vacio(list, 'Sin fotos en la hoja aun.'); return; }
    list.innerHTML = '';
    rows.forEach((f, i) => {
      const src = this.driveImg(f.imagenUrl, 120);
      const item = document.createElement('div');
      item.className = 'li-item';
      item.style.cssText = 'align-items:flex-start;gap:14px;';
      item.innerHTML =
        '<div style="width:80px;height:65px;border-radius:8px;overflow:hidden;background:#f0f0f0;flex-shrink:0;">' +
        (src ? '<img src="' + src + '" style="width:100%;height:100%;object-fit:cover;">' : '') + '</div>' +
        '<div style="flex:1;min-width:0;"><h4>' + (f.descripcion || 'Sin descripcion') + '</h4><p>Imagen de Google Drive</p></div>' +
        '<div class="li-actions"><button class="btn-del" onclick="UNHO.deleteFoto(' + i + ')">Eliminar</button></div>';
      list.appendChild(item);
    });
  },

  async addFoto() {
    const b = this._lock();
    const imagen = this.val('inp-gal-drive');
    if (!imagen) { this._unlock(b); alert('Pega el enlace o ID de Drive de la foto'); return; }
    const fila = { descripcion: this.val('inp-gal-desc'), imagenUrl: imagen };
    const res = await this.agregar('Galeria', fila);
    this._unlock(b);
    if (res && res.ok === false) { alert('Error: ' + res.error); return; }
    this.clear(['inp-gal-desc','inp-gal-drive']);
    const prev = document.getElementById('gal-foto-preview'); if (prev) prev.style.display = 'none';
    this.showMsg('msg-galeria');
    setTimeout(() => this.renderGaleria(), 1200);
  },

  async deleteFoto(i) {
    if (!confirm('Eliminar esta foto de la hoja?')) return;
    await this.eliminar('Galeria', i);
    setTimeout(() => this.renderGaleria(), 1200);
  },

  previewGalFoto() {
    const v = this.val('inp-gal-drive');
    if (!v) { alert('Pega el enlace o ID de Drive'); return; }
    const img = document.getElementById('gal-prev-img');
    const box = document.getElementById('gal-foto-preview');
    if (img) img.src = this.driveImg(v, 400);
    if (box) box.style.display = 'flex';
  },

  // ════════════════════════════════  PARTICIPA (fija)  ════════════════════════════════
  renderParticipa() {
    const list = document.getElementById('list-participa');
    if (list) this.vacio(list, 'La seccion "Participa" es fija (botones de redes). No se administra desde aqui.');
  },
  addParticipa() { alert('La seccion "Participa" es fija y no se administra desde el panel.'); },

  // ════════════════════════════════  SUBIDA DE ARCHIVOS (no usada en este modo)  ════════════════════════════════
  _subirNoDisponible() {
    alert('En este modo: primero sube la foto o PDF a tu Google Drive, y luego pega el ENLACE en el campo de Drive. El boton "subir desde el dispositivo" no se usa aqui.');
  },
  handleNotFileUpload() { this._subirNoDisponible(); },
  handleProyFileUpload() { this._subirNoDisponible(); },
  handleEqFileUpload() { this._subirNoDisponible(); },
  handleGalFileUpload() { this._subirNoDisponible(); },
  handlePartFileUpload() { this._subirNoDisponible(); },
  handleHeroBg() { this._subirNoDisponible(); },
  previewPartFoto() { this._subirNoDisponible(); },
  previewHeroBg() { alert('La portada se edita directamente en el codigo de la pagina.'); },
  saveHeroBg() { alert('La portada se edita directamente en el codigo de la pagina.'); },
  saveHeroTexto() { alert('El texto de portada se edita directamente en el codigo de la pagina.'); },
  saveContacto() { this.showMsg('msg-contacto'); },

  // ── Bloqueo visual del boton mientras se envia ──
  _lock() {
    const b = (typeof event !== 'undefined' && event && event.target) ? event.target : null;
    if (b && b.tagName === 'BUTTON') { b._t = b.textContent; b.textContent = 'Guardando...'; b.disabled = true; return b; }
    return null;
  },
  _unlock(b) {
    if (b && b.tagName === 'BUTTON') { b.textContent = b._t || 'Listo'; b.disabled = false; }
  }
};

document.addEventListener('DOMContentLoaded', () => UNHO.init());
