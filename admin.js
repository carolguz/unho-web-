// ══════════════════════════════════════════════
//  UNHO Admin Panel — conectado a la hoja de Google
//  Escribe, elimina y lee a traves del puente Apps Script.
// ══════════════════════════════════════════════

const UNHO = {

  SCRIPT_URL: "https://script.google.com/macros/s/AKfycbxGNkflz8A94WYqhvzGtcskR1T8Kx-oZWhX6gHXXjOuUJHw5VE0wuyLX-_BNuryYS8RNw/exec",
  SHEET_ID: "1Js6x9ChrZG_FscvU3sODHmIAU5-2scYWF3JX9u2dad8",

  credentials: { user: 'admin', pass: 'unho2025' },
  state: { isLoggedIn: false, currentPanel: 'inicio' },

  init() {
    this.bindLogin();
    // Un solo "vigilante" de clics atiende TODOS los botones Eliminar (delegacion de eventos)
    document.addEventListener('click', (ev) => {
      const btn = ev.target.closest ? ev.target.closest('.btn-del') : null;
      if (!btn) return;
      const tab = btn.getAttribute('data-tab');
      const row = btn.getAttribute('data-row');
      if (tab && row) { ev.preventDefault(); this.borrarFila(tab, row, btn); }
    });
  },

  // ════════ LOGIN ════════
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

  // ════════ NAVEGACION ════════
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

  // ════════ COMUNICACION CON EL PUENTE ════════
  async leerTab(tab) {
    try {
      const r = await fetch(this.SCRIPT_URL + "?tab=" + encodeURIComponent(tab) + "&_=" + Date.now());
      const data = await r.json();
      return (data && data.filas) ? data.filas : [];
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
    } catch (e) { console.warn("Aviso al enviar:", e); return { ok: true, aviso: true }; }
  },

  agregar(pestana, fila) { return this.enviar({ accion: "agregar", pestana, fila }); },
  eliminar(pestana, fila) { return this.enviar({ accion: "eliminar", pestana, fila }); },

  // Borra una fila (lo llama el vigilante de clics) y refresca esa seccion
  async borrarFila(tab, row, btn) {
    if (!confirm('¿Eliminar este elemento? Se borrará de la hoja. (La foto o PDF en Drive NO se borra.)')) return;
    if (btn) { btn.dataset._t = btn.textContent; btn.textContent = 'Eliminando...'; btn.disabled = true; }
    await this.eliminar(tab, row);
    const mapa = {
      'Noticias': () => this.renderNoticias(),
      'proyectos': () => this.renderProyectos(),
      'Empleos': () => this.renderEmpleos(),
      'Equipo': () => this.renderEquipo(),
      'Galeria': () => this.renderGaleria()
    };
    setTimeout(() => { if (mapa[tab]) mapa[tab](); }, 1200);
  },

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
  showMsg(id) { const el = document.getElementById(id); if (!el) return; el.style.display = 'block'; setTimeout(() => el.style.display = 'none', 3000); },
  val(id) { const el = document.getElementById(id); return el ? ('' + el.value).trim() : ''; },
  clear(ids) { ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; }); },

  // boton Eliminar con datos para la delegacion (data-tab + data-row)
  botonEliminar(tab, row) {
    return '<div class="li-actions"><button class="btn-del" data-tab="' + tab + '" data-row="' + row + '">Eliminar</button></div>';
  },

  // ════════ NOTICIAS ════════
  async renderNoticias() {
    const list = document.getElementById('list-noticias-admin');
    if (!list) return;
    this.cargando(list);
    const rows = await this.leerTab('Noticias');
    if (rows.length === 0) { this.vacio(list, 'Sin noticias en la hoja aun.'); return; }
    list.innerHTML = rows.map((n, i) => {
      const src = this.driveImg(n.imagenUrl, 120);
      return '<div class="li-item" style="gap:14px;align-items:flex-start;">' +
        '<div style="width:70px;height:56px;border-radius:8px;overflow:hidden;background:#f0f0f0;flex-shrink:0;">' +
        (src ? '<img src="' + src + '" style="width:100%;height:100%;object-fit:cover;">' : '') + '</div>' +
        '<div style="flex:1;"><h4>' + (n.titulo || '(sin titulo)') + '</h4><p>' + (n.fecha || '') + '</p></div>' +
        this.botonEliminar('Noticias', n._row || (i + 2)) + '</div>';
    }).join('');
  },

  async addNoticia() {
    const titulo = this.val('inp-not-titulo');
    if (!titulo) { alert('Ingresa el titulo de la noticia'); return; }
    let fecha = this.val('inp-not-fecha');
    if (fecha) {
      const d = new Date(fecha + 'T12:00:00');
      if (!isNaN(d)) fecha = d.toLocaleDateString('es-GT', { day:'numeric', month:'short', year:'numeric' }).toUpperCase();
    }
    const fila = {
      titulo, fecha,
      texto: this.val('inp-not-texto'),
      link: this.val('inp-not-link'),
      imagenUrl: this.val('inp-not-imgurl') || this.val('inp-not-drive')
    };
    const res = await this.agregar('Noticias', fila);
    if (res && res.ok === false) { alert('Error: ' + res.error); return; }
    this.clear(['inp-not-titulo','inp-not-fecha','inp-not-texto','inp-not-link','inp-not-imgurl','inp-not-drive']);
    const prev = document.getElementById('not-foto-preview'); if (prev) prev.style.display = 'none';
    this.showMsg('msg-noticias');
    setTimeout(() => this.renderNoticias(), 1200);
  },

  previewNotFoto() {
    const v = this.val('inp-not-drive') || this.val('inp-not-imgurl');
    if (!v) { alert('Pega el enlace o ID de Drive'); return; }
    const img = document.getElementById('not-prev-img'); const box = document.getElementById('not-foto-preview');
    if (img) img.src = this.driveImg(v, 400); if (box) box.style.display = 'block';
  },

  // ════════ PROYECTOS ════════
  async renderProyectos() {
    const list = document.getElementById('list-proyectos');
    if (!list) return;
    this.cargando(list);
    const rows = await this.leerTab('proyectos');
    if (rows.length === 0) { this.vacio(list, 'Sin proyectos en la hoja aun.'); return; }
    list.innerHTML = rows.map((p, i) => {
      const src = this.driveImg(p.imagenUrl, 120);
      return '<div class="li-item" style="align-items:flex-start;gap:14px;">' +
        '<div style="width:70px;height:56px;border-radius:8px;overflow:hidden;background:#f0f0f0;flex-shrink:0;">' +
        (src ? '<img src="' + src + '" style="width:100%;height:100%;object-fit:cover;">' : '') + '</div>' +
        '<div style="flex:1;"><h4>' + (p.titulo || '(sin titulo)') + '</h4><p>' + (p.categoria || '') + '</p></div>' +
        this.botonEliminar('proyectos', p._row || (i + 2)) + '</div>';
    }).join('');
  },

  async addProyecto() {
    const titulo = this.val('inp-proy-titulo');
    if (!titulo) { alert('Ingresa el nombre del proyecto'); return; }
    const fila = {
      titulo,
      categoria: this.val('inp-proy-cat'),
      descripcion: this.val('inp-proy-desc'),
      link: this.val('inp-proy-link'),
      imagenUrl: this.val('inp-proy-drive')
    };
    const res = await this.agregar('proyectos', fila);
    if (res && res.ok === false) { alert('Error: ' + res.error); return; }
    this.clear(['inp-proy-titulo','inp-proy-desc','inp-proy-link','inp-proy-drive']);
    const prev = document.getElementById('proy-foto-preview'); if (prev) prev.style.display = 'none';
    this.showMsg('msg-proyectos');
    setTimeout(() => this.renderProyectos(), 1200);
  },

  previewProyFoto() {
    const v = this.val('inp-proy-drive');
    if (!v) { alert('Pega el enlace o ID de Drive'); return; }
    const img = document.getElementById('proy-prev-img'); const box = document.getElementById('proy-foto-preview');
    if (img) img.src = this.driveImg(v, 400); if (box) box.style.display = 'flex';
  },

  // ════════ EMPLEOS ════════
  async renderEmpleos() {
    const list = document.getElementById('list-empleos');
    if (!list) return;
    this.cargando(list);
    const rows = await this.leerTab('Empleos');
    if (rows.length === 0) { this.vacio(list, 'Sin vacantes en la hoja aun.'); return; }
    list.innerHTML = rows.map((e, i) =>
      '<div class="li-item">' +
        '<div style="flex:1;"><h4>' + (e.puesto || '(sin puesto)') + '</h4><p>' +
        [e.ubicacion, e.duracion].filter(Boolean).join(' · ') + '</p></div>' +
        this.botonEliminar('Empleos', e._row || (i + 2)) +
      '</div>').join('');
  },

  async addEmpleo() {
    const puesto = this.val('inp-emp-puesto');
    if (!puesto) { alert('Ingresa el nombre del puesto'); return; }
    const fila = {
      puesto,
      duracion: this.val('inp-emp-duracion'),
      ubicacion: this.val('inp-emp-ubicacion'),
      descripcion: this.val('inp-emp-desc'),
      requisitos: this.val('inp-emp-req'),
      pdfUrl: this.val('inp-emp-pdfurl') || this.val('inp-emp-driveid')
    };
    const res = await this.agregar('Empleos', fila);
    if (res && res.ok === false) { alert('Error: ' + res.error); return; }
    this.clear(['inp-emp-puesto','inp-emp-duracion','inp-emp-ubicacion','inp-emp-desc','inp-emp-req','inp-emp-pdfurl','inp-emp-driveid']);
    this.showMsg('msg-empleos');
    setTimeout(() => this.renderEmpleos(), 1200);
  },

  // ════════ EQUIPO ════════
  async renderEquipo() {
    const list = document.getElementById('list-equipo');
    if (!list) return;
    this.cargando(list);
    const rows = await this.leerTab('Equipo');
    if (rows.length === 0) { this.vacio(list, 'Sin integrantes en la hoja aun.'); return; }
    list.innerHTML = rows.map((m, i) => {
      const src = this.driveImg(m.imagenUrl, 120);
      return '<div class="li-item" style="gap:14px;">' +
        (src ? '<img src="' + src + '" style="width:50px;height:50px;border-radius:50%;object-fit:cover;flex-shrink:0;">'
             : '<div style="width:50px;height:50px;border-radius:50%;background:#f0f0f0;flex-shrink:0;"></div>') +
        '<div style="flex:1;"><h4>' + (m.nombre || '(sin nombre)') + '</h4><p>' + (m.cargo || '') + '</p></div>' +
        this.botonEliminar('Equipo', m._row || (i + 2)) + '</div>';
    }).join('');
  },

  async addEquipo() {
    const nombre = this.val('inp-eq-nombre');
    if (!nombre) { alert('Ingresa el nombre'); return; }
    const fila = {
      nombre,
      cargo: this.val('inp-eq-cargo'),
      descripcion: this.val('inp-eq-desc'),
      imagenUrl: this.val('inp-eq-drive')
    };
    const res = await this.agregar('Equipo', fila);
    if (res && res.ok === false) { alert('Error: ' + res.error); return; }
    this.clear(['inp-eq-nombre','inp-eq-cargo','inp-eq-desc','inp-eq-drive']);
    const prev = document.getElementById('eq-foto-preview'); if (prev) prev.style.display = 'none';
    this.showMsg('msg-equipo');
    setTimeout(() => this.renderEquipo(), 1200);
  },

  previewEqFoto() {
    const v = this.val('inp-eq-drive');
    if (!v) { alert('Pega el enlace o ID de Drive'); return; }
    const img = document.getElementById('eq-prev-img'); const box = document.getElementById('eq-foto-preview');
    if (img) img.src = this.driveImg(v, 400); if (box) box.style.display = 'flex';
  },

  // ════════ GALERIA ════════
  async renderGaleria() {
    const list = document.getElementById('list-galeria');
    if (!list) return;
    this.cargando(list);
    const rows = await this.leerTab('Galeria');
    if (rows.length === 0) { this.vacio(list, 'Sin fotos en la hoja aun.'); return; }
    list.innerHTML = rows.map((f, i) => {
      const src = this.driveImg(f.imagenUrl, 120);
      return '<div class="li-item" style="align-items:flex-start;gap:14px;">' +
        '<div style="width:80px;height:65px;border-radius:8px;overflow:hidden;background:#f0f0f0;flex-shrink:0;">' +
        (src ? '<img src="' + src + '" style="width:100%;height:100%;object-fit:cover;">' : '') + '</div>' +
        '<div style="flex:1;min-width:0;"><h4>' + (f.descripcion || 'Sin descripcion') + '</h4><p>Imagen de Google Drive</p></div>' +
        this.botonEliminar('Galeria', f._row || (i + 2)) + '</div>';
    }).join('');
  },

  async addFoto() {
    const imagen = this.val('inp-gal-drive');
    if (!imagen) { alert('Pega el enlace o ID de Drive de la foto'); return; }
    const fila = { descripcion: this.val('inp-gal-desc'), imagenUrl: imagen };
    const res = await this.agregar('Galeria', fila);
    if (res && res.ok === false) { alert('Error: ' + res.error); return; }
    this.clear(['inp-gal-desc','inp-gal-drive']);
    const prev = document.getElementById('gal-foto-preview'); if (prev) prev.style.display = 'none';
    this.showMsg('msg-galeria');
    setTimeout(() => this.renderGaleria(), 1200);
  },

  previewGalFoto() {
    const v = this.val('inp-gal-drive');
    if (!v) { alert('Pega el enlace o ID de Drive'); return; }
    const img = document.getElementById('gal-prev-img'); const box = document.getElementById('gal-foto-preview');
    if (img) img.src = this.driveImg(v, 400); if (box) box.style.display = 'flex';
  },

  // ════════ PARTICIPA (fija) ════════
  renderParticipa() {
    const list = document.getElementById('list-participa');
    if (list) this.vacio(list, 'La seccion "Participa" es fija (botones de redes). No se administra desde aqui.');
  },
  addParticipa() { alert('La seccion "Participa" es fija y no se administra desde el panel.'); },

  // ════════ ARCHIVOS (no usados en este modo) ════════
  _subirNoDisponible() { alert('En este modo: sube la foto o PDF a tu Google Drive y pega el ENLACE en el campo de Drive. El boton "subir desde el dispositivo" no se usa aqui.'); },
  handleNotFileUpload() { this._subirNoDisponible(); },
  handleProyFileUpload() { this._subirNoDisponible(); },
  handleEqFileUpload() { this._subirNoDisponible(); },
  handleGalFileUpload() { this._subirNoDisponible(); },
  handlePartFileUpload() { this._subirNoDisponible(); },
  handleHeroBg() { this._subirNoDisponible(); },
  previewPartFoto() { this._subirNoDisponible(); },
  previewHeroBg() { alert('La portada se edita en el codigo de la pagina.'); },
  saveHeroBg() { alert('La portada se edita en el codigo de la pagina.'); },
  saveHeroTexto() { alert('El texto de portada se edita en el codigo de la pagina.'); },
  saveContacto() { this.showMsg('msg-contacto'); }
};

// Hacer UNHO accesible globalmente (para los botones del HTML)
window.UNHO = UNHO;

document.addEventListener('DOMContentLoaded', () => UNHO.init());
