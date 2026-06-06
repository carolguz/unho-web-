// ══════════════════════════════════════════════
//  UNHO Admin Panel — JavaScript Module
//  Archivo: admin.js
// ══════════════════════════════════════════════

const UNHO = {
  // ── Credenciales (cámbialas aquí) ──
  credentials: { user: 'admin', pass: 'unho2025' },

  // ── Estado de la aplicación ──
  state: {
    isLoggedIn: false,
    currentPanel: 'inicio',
    data: {
      proyectos: [
        { id: 1, nombre: 'Proyecto educación', categoria: 'Educación', estado: 'Activo' },
        { id: 2, nombre: 'Proyecto salud', categoria: 'Salud', estado: 'Activo' },
      ],
      noticias: [
        { id: 1, titulo: 'Título de noticia', fecha: '2025-06-01', resumen: 'Resumen de noticia.' },
      ],
      convocatorias: [
        { id: 1, titulo: 'Invitación a cotizar', tipo: 'Invitación', vence: '', link: '#' },
      ],
      empleos: [
        { id: 1, puesto: 'Coordinador de proyectos', tipo: 'Tiempo completo', area: 'Administración' },
      ],
      galeria: [],
    }
  },

  // ── Inicializar ──
  init() {
    this.bindLogin();
    this._convFotasTemp = [];
    this.renderAll();
  },

  // ── LOGIN ──
  bindLogin() {
    document.getElementById('loginPass').addEventListener('keydown', e => {
      if (e.key === 'Enter') this.login();
    });
  },

  login() {
    const u = document.getElementById('loginUser').value.trim();
    const p = document.getElementById('loginPass').value.trim();
    const err = document.getElementById('loginErr');
    if (u === this.credentials.user && p === this.credentials.pass) {
      document.getElementById('loginScreen').style.display = 'none';
      document.getElementById('dashboard').style.display = 'block';
      this.state.isLoggedIn = true;
    } else {
      err.style.display = 'block';
      setTimeout(() => err.style.display = 'none', 3500);
    }
  },

  logout() {
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('loginUser').value = '';
    document.getElementById('loginPass').value = '';
    this.state.isLoggedIn = false;
  },

  // ── PANEL NAVIGATION ──
  showPanel(name) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.sb-btn').forEach(b => b.classList.remove('active'));
    const panel = document.getElementById('panel-' + name);
    const btn = document.getElementById('sbtn-' + name);
    if (panel) panel.classList.add('active');
    if (btn) btn.classList.add('active');
    this.state.currentPanel = name;
    if (name === 'proyectos') this.renderProyectos();
    if (name === 'proyectos') this.renderProyectos();
    if (name === 'noticias') this.renderNoticias();
    if (name === 'convocatorias') this.renderConvocatorias();
    if (name === 'empleos') this.renderEmpleos();
    if (name === 'proyectos') this.renderProyectos();
    if (name === 'noticias') this.renderNoticias();
    if (name === 'equipo') this.renderEquipo();
    if (name === 'galeria') this.renderGaleria();
    if (name === 'convocatorias') this.renderConvocatorias();
    if (name === 'participa') this.renderParticipa();
  },

  // ── RENDER HELPERS ──
  renderAll() {
    this.renderProyectos();
    this.renderProyectos();
    this.renderNoticias();
    this.renderConvocatorias();
    this.renderEmpleos();
    this.renderProyectos();
    this.renderNoticias();
    this.renderEquipo();
    this.renderGaleria();
    this.renderConvocatorias();
    this.renderParticipa();
    this.updateStats();
  },

  updateStats() {
    const s = this.state.data;
    document.getElementById('stat-proyectos').textContent = s.proyectos.length;
    document.getElementById('stat-noticias').textContent = s.noticias.length;
    document.getElementById('stat-convocatorias').textContent = s.convocatorias.length;
    document.getElementById('stat-empleos').textContent = s.empleos.length;
  },

  // ── PROYECTOS ──
  renderProyectos() {
    const list = document.getElementById('list-proyectos');
    if (!list) return;
    const items = JSON.parse(localStorage.getItem('unho_proyectos') || '[]');
    if (items.length === 0) {
      list.innerHTML = '<p style="color:var(--gray);font-size:13px;padding:1rem 0;">Sin proyectos publicados aun.</p>';
      this.updateStats(); return;
    }
    list.innerHTML = items.map((p, i) => {
      const src = p.base64 || (p.driveId ? "https://drive.google.com/thumbnail?id=" + p.driveId + "&sz=w80" : "");
      return '<div class="li-item" style="align-items:flex-start;gap:14px;">' +
        '<div style="width:70px;height:56px;border-radius:8px;overflow:hidden;background:#f0f0f0;flex-shrink:0;display:flex;align-items:center;justify-content:center;">' +
        (src ? '<img src="' + src + '" style="width:100%;height:100%;object-fit:cover;">' : '<span style="font-size:20px;">&#128193;</span>') +
        '</div>' +
        '<div style="flex:1;"><h4>' + p.titulo + '</h4><p>' + (p.categoria||'') + '</p></div>' +
        '<div class="li-actions"><button class="btn-del" onclick="UNHO.deleteProyecto(' + i + ')">Eliminar</button></div>' +
        '</div>';
    }).join('');
    this.updateStats();
  },

  addProyecto() {
    const titulo      = document.getElementById('inp-proy-titulo').value.trim();
    const categoria   = document.getElementById('inp-proy-cat').value;
    const descripcion = document.getElementById('inp-proy-desc').value.trim();
    const link        = document.getElementById('inp-proy-link').value.trim();
    const driveId     = document.getElementById('inp-proy-drive').value.trim();
    const base64      = document.getElementById('inp-proy-drive').dataset.base64 || '';

    if (!titulo) { alert('Ingresa el nombre del proyecto'); return; }
    if (!descripcion) { alert('Ingresa la descripcion del proyecto'); return; }

    const items = JSON.parse(localStorage.getItem('unho_proyectos') || '[]');
    items.push({ titulo, categoria, descripcion, link, driveId, base64, fotos: [] });
    localStorage.setItem('unho_proyectos', JSON.stringify(items));

    ['inp-proy-titulo','inp-proy-desc','inp-proy-link','inp-proy-drive'].forEach(id => {
      const el = document.getElementById(id); if(el){ el.value=''; delete el.dataset.base64; }
    });
    document.getElementById('proy-foto-preview').style.display = 'none';

    this.renderProyectos();
    this.showMsg('msg-proyectos');
  },

  deleteProyecto(index) {
    if (!confirm('Eliminar este proyecto?')) return;
    const items = JSON.parse(localStorage.getItem('unho_proyectos') || '[]');
    items.splice(index, 1);
    localStorage.setItem('unho_proyectos', JSON.stringify(items));
    this.renderProyectos();
  },

  previewProyFoto() {
    const id = document.getElementById('inp-proy-drive').value.trim();
    if (!id) { alert('Ingresa el ID de Drive'); return; }
    document.getElementById('proy-prev-img').src = "https://drive.google.com/thumbnail?id=" + id + "&sz=w300";
    document.getElementById('proy-foto-preview').style.display = 'flex';
  },

  handleProyFileUpload(input) {
    const file = input.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      document.getElementById('proy-prev-img').src = e.target.result;
      document.getElementById('proy-foto-preview').style.display = 'flex';
      document.getElementById('inp-proy-drive').dataset.base64 = e.target.result;
      document.getElementById('inp-proy-drive').value = '';
    };
    reader.readAsDataURL(file);
  },

  // ── NOTICIAS ──
  renderNoticias() {
    const list = document.getElementById('list-noticias');
    if (!list) return;
    list.innerHTML = this.state.data.noticias.map(n => `
      <div class="li-item">
        <div><h4>${n.titulo}</h4><p>${n.fecha}</p></div>
        <div class="li-actions">
          <button class="btn-del" onclick="UNHO.deleteItem('noticias', ${n.id})">Eliminar</button>
        </div>
      </div>`).join('') || '<p style="color:var(--gray);font-size:13px;">Sin noticias publicadas.</p>';
    this.updateStats();
  },

  addNoticia() {
    const titulo = document.getElementById('inp-not-titulo').value.trim();
    const fecha  = document.getElementById('inp-not-fecha').value;
    const texto  = document.getElementById('inp-not-texto') ? document.getElementById('inp-not-texto').value.trim() : '';
    const link   = document.getElementById('inp-not-link').value.trim();
    const imageUrl  = document.getElementById('inp-not-imgurl') ? document.getElementById('inp-not-imgurl').value.trim() : '';
    const driveImgId= document.getElementById('inp-not-drive') ? document.getElementById('inp-not-drive').value.trim() : '';
    const base64 = document.getElementById('inp-not-drive') ? (document.getElementById('inp-not-drive').dataset.base64 || '') : '';

    if (!titulo) { alert('Ingresa el titulo de la noticia'); return; }

    let fechaFormateada = fecha;
    if (fecha) {
      const d = new Date(fecha + 'T12:00:00');
      fechaFormateada = d.toLocaleDateString('es-GT', { day:'numeric', month:'short', year:'numeric' }).toUpperCase();
    }

    const saved = JSON.parse(localStorage.getItem('unho_noticias') || '[]');
    saved.unshift({ titulo, fecha: fechaFormateada, texto, link, imageUrl, driveImgId, base64 });
    localStorage.setItem('unho_noticias', JSON.stringify(saved));

    ['inp-not-titulo','inp-not-texto','inp-not-link','inp-not-drive','inp-not-imgurl'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.value = ''; delete el.dataset.base64; }
    });
    document.getElementById('inp-not-fecha').value = '';
    document.getElementById('not-foto-preview').style.display = 'none';

    this.renderProyectos();
    this.renderNoticias();
    this.showMsg('msg-noticias');
  },


  // ── CONVOCATORIAS ──
  renderConvocatorias() {
    const list = document.getElementById('list-conv');
    if (!list) return;
    const items = JSON.parse(localStorage.getItem('unho_conv') || '[]');
    if (items.length === 0) {
      list.innerHTML = '<p style="color:var(--gray);font-size:13px;padding:1rem 0;">Sin convocatorias publicadas aun.</p>';
      this.updateStats(); return;
    }
    list.innerHTML = items.map((c, i) => `
      <div class="li-item">
        <div style="flex:1;">
          <h4>${c.titulo}</h4>
          <p>${c.fecha || ''} · ${c.pdfUrl || c.driveId ? "PDF configurado" : "Sin PDF"}</p>
        </div>
        <div class="li-actions">
          <button class="btn-del" onclick="UNHO.deleteConvocatoria(${i})">Eliminar</button>
        </div>
      </div>`).join('');
    this.updateStats();
  },

  addConvocatoria() {
    const titulo  = document.getElementById('inp-conv-titulo').value.trim();
    const fecha   = document.getElementById('inp-conv-fecha').value.trim();
    const desc    = document.getElementById('inp-conv-desc').value.trim();
    const pdfUrl  = document.getElementById('inp-conv-pdfurl').value.trim();
    const driveId = document.getElementById('inp-conv-driveid').value.trim();
    const fotos   = this._convFotasTemp || [];

    if (!titulo) { alert('Ingresa el titulo'); return; }

    const items = JSON.parse(localStorage.getItem('unho_conv') || '[]');
    items.unshift({ titulo, fecha, descripcion:desc, pdfUrl, driveId, fotos });
    localStorage.setItem('unho_conv', JSON.stringify(items));

    ['inp-conv-titulo','inp-conv-fecha','inp-conv-desc','inp-conv-pdfurl','inp-conv-driveid','inp-conv-foto-drive']
      .forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
    const preview = document.getElementById('conv-fotos-preview');
    if (preview) preview.innerHTML = '';
    this._convFotasTemp = [];

    this.renderConvocatorias();
    this.showMsg('msg-conv');
  },

  previewConvFotos(input) {
    const files = Array.from(input.files);
    if (!this._convFotasTemp) this._convFotasTemp = [];
    const preview = document.getElementById('conv-fotos-preview');
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        this._convFotasTemp.push({ base64: e.target.result });
        if (preview) {
          const img = document.createElement('img');
          img.src = e.target.result;
          img.style.cssText = 'width:70px;height:56px;object-fit:cover;border-radius:8px;border:2px solid var(--green);';
          preview.appendChild(img);
        }
      };
      reader.readAsDataURL(file);
    });
  },

  addConvDriveFoto() {
    const id = document.getElementById('inp-conv-foto-drive').value.trim();
    if (!id) { alert('Ingresa el ID de Drive'); return; }
    if (!this._convFotasTemp) this._convFotasTemp = [];
    this._convFotasTemp.push({ driveId: id });
    const preview = document.getElementById('conv-fotos-preview');
    if (preview) {
      const img = document.createElement('img');
      img.src = `https://drive.google.com/thumbnail?id=${id}&sz=w120`;
      img.style.cssText = 'width:70px;height:56px;object-fit:cover;border-radius:8px;border:2px solid var(--green);';
      preview.appendChild(img);
    }
    document.getElementById('inp-conv-foto-drive').value = '';
  },

  deleteConvocatoria(index) {
    if (!confirm('Eliminar esta convocatoria?')) return;
    const items = JSON.parse(localStorage.getItem('unho_conv') || '[]');
    items.splice(index, 1);
    localStorage.setItem('unho_conv', JSON.stringify(items));
    this.renderConvocatorias();
  },


  deleteConvocatoria(id) {
    if (!confirm('Eliminar esta convocatoria?')) return;
    const saved = JSON.parse(localStorage.getItem('unho_conv') || '[]').filter(x => x.id !== id);
    localStorage.setItem('unho_conv', JSON.stringify(saved));
    this.renderConvocatorias();
  },



  // ── EMPLEOS ──
  renderEmpleos() {
    const list = document.getElementById('list-empleos');
    if (!list) return;
    const saved = JSON.parse(localStorage.getItem('unho_empleos') || '[]');
    if (saved.length === 0) {
      list.innerHTML = '<p style="color:var(--gray);font-size:13px;padding:1rem 0;">Sin vacantes adicionales. La vacante de Coordinador aparece por defecto.</p>';
      return;
    }
    list.innerHTML = saved.map((e, i) => `
      <div class="li-item">
        <div style="flex:1;">
          <h4>${e.puesto}</h4>
          <p>${e.tipo}${e.ubicacion ? " · " + e.ubicacion : ""}${e.duracion ? " · " + e.duracion : ""}</p>
        </div>
        <div class="li-actions">
          <span class="badge ${e.activo !== false ? "b-g" : "b-a"}">${e.activo !== false ? "Activa" : "Inactiva"}</span>
          <button class="btn-del" onclick="UNHO.deleteEmpleo(${i})">Eliminar</button>
        </div>
      </div>`).join('');
    this.updateStats();
  },

  addEmpleo() {
    const puesto = document.getElementById('inp-emp-puesto').value.trim();
    const tipo = document.getElementById('inp-emp-tipo').value;
    const duracion = document.getElementById('inp-emp-duracion').value.trim();
    const ubicacion = document.getElementById('inp-emp-ubicacion').value.trim();
    const descripcion = document.getElementById('inp-emp-desc').value.trim();
    const requisitos = document.getElementById('inp-emp-req').value.trim();
    const driveId = document.getElementById('inp-emp-drive').value.trim();
    const pdfUrl = document.getElementById('inp-emp-pdfurl') ? document.getElementById('inp-emp-pdfurl').value.trim() : '';

    if (!puesto) { alert("Ingresa el nombre del puesto"); return; }

    const saved = JSON.parse(localStorage.getItem('unho_empleos') || '[]');
    saved.unshift({ puesto, tipo, duracion, ubicacion, descripcion, requisitos, driveId, pdfUrl, activo: true });
    localStorage.setItem('unho_empleos', JSON.stringify(saved));

    ["inp-emp-puesto","inp-emp-duracion","inp-emp-ubicacion","inp-emp-desc","inp-emp-req","inp-emp-drive","inp-emp-pdfurl"].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = "";
    });

    this.renderEmpleos();
    this.showMsg("msg-empleos");
  },

  deleteEmpleo(index) {
    if (!confirm("¿Eliminar esta vacante?")) return;
    const saved = JSON.parse(localStorage.getItem('unho_empleos') || '[]');
    saved.splice(index, 1);
    localStorage.setItem('unho_empleos', JSON.stringify(saved));
    this.renderEmpleos();
  },




  // ── NOTICIAS ──
  renderNoticias() {
    const list = document.getElementById('list-noticias-admin');
    if (!list) return;
    const saved = JSON.parse(localStorage.getItem('unho_noticias') || '[]');
    if (saved.length === 0) {
      list.innerHTML = '<p style="color:var(--gray);font-size:13px;padding:1rem 0;">Sin noticias agregadas aun. La noticia de UICN se muestra por defecto.</p>';
      this.updateStats();
      return;
    }
    list.innerHTML = saved.map((n, i) => `
      <div class="li-item" style="align-items:flex-start;gap:14px;">
        <div style="flex-shrink:0;width:70px;height:55px;border-radius:8px;overflow:hidden;background:#f0f0f0;display:flex;align-items:center;justify-content:center;">
          ${n.base64
            ? `<img src="${n.base64}" style="width:100%;height:100%;object-fit:cover;">`
            : n.driveId
              ? `<img src="https://drive.google.com/thumbnail?id=${n.driveId}&sz=w140" style="width:100%;height:100%;object-fit:cover;">`
              : `<svg width="22" height="22" fill="none" stroke="#ccc" stroke-width="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`}
        </div>
        <div style="flex:1;min-width:0;">
          <h4 style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${n.titulo}</h4>
          <p>${n.fecha || 'Sin fecha'}</p>
          ${n.link ? '<span style="font-size:11px;color:var(--green);font-weight:700;">Tiene enlace externo</span>' : ''}
        </div>
        <div class="li-actions">
          <button class="btn-del" onclick="UNHO.deleteNoticia(${i})">Eliminar</button>
        </div>
      </div>`).join('');
    this.updateStats();
  },

  addNoticia() {
    const titulo = document.getElementById('inp-not-titulo').value.trim();
    const texto = document.getElementById('inp-not-texto').value.trim();
    const fecha = document.getElementById('inp-not-fecha-val')
      ? document.getElementById('inp-not-fecha-val').value
      : document.getElementById('inp-not-fecha').value;
    const link = document.getElementById('inp-not-link').value.trim();
    const driveImgId = document.getElementById('inp-not-drive').value.trim();

    if (!titulo) { alert('Ingresa el titulo de la noticia'); return; }
    if (!texto) { alert('Ingresa el texto de la noticia'); return; }

    // Format date nicely
    let fechaFormateada = fecha;
    if (fecha) {
      const d = new Date(fecha + 'T12:00:00');
      fechaFormateada = d.toLocaleDateString('es-GT', { day:'numeric', month:'short', year:'numeric' }).toUpperCase();
    }

    const saved = JSON.parse(localStorage.getItem('unho_noticias') || '[]');
    saved.unshift({ titulo, texto, fecha: fechaFormateada, link, driveImgId });
    localStorage.setItem('unho_noticias', JSON.stringify(saved));

    // Clear form
    ['inp-not-titulo','inp-not-texto','inp-not-link','inp-not-drive'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.value = ''; delete el.dataset.base64; }
    });
    document.getElementById('inp-not-fecha').value = '';
    document.getElementById('not-foto-preview').style.display = 'none';

    this.renderProyectos();
    this.renderNoticias();
    this.showMsg('msg-noticias');
  },

  exportNoticiasJSON() {
    // Export noticias as JSON for uploading to Drive
    const saved = JSON.parse(localStorage.getItem('unho_noticias') || '[]');
    const blob = new Blob([JSON.stringify(saved, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'noticias.json'; a.click();
    URL.revokeObjectURL(url);
  },

  deleteNoticia(index) {
    if (!confirm('¿Eliminar esta noticia?')) return;
    const saved = JSON.parse(localStorage.getItem('unho_noticias') || '[]');
    saved.splice(index, 1);
    localStorage.setItem('unho_noticias', JSON.stringify(saved));
    this.renderProyectos();
    this.renderNoticias();
  },

  previewNotFoto() {
    const id = document.getElementById('inp-not-drive').value.trim();
    if (!id) { alert('Ingresa el ID de Drive'); return; }
    const img = document.getElementById('not-prev-img');
    img.src = 'https://drive.google.com/thumbnail?id=' + id + '&sz=w300';
    document.getElementById('not-foto-preview').style.display = 'flex';
  },

  handleNotFileUpload(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('not-prev-img').src = e.target.result;
      document.getElementById('not-foto-preview').style.display = 'flex';
      document.getElementById('inp-not-drive').dataset.base64 = e.target.result;
      document.getElementById('inp-not-drive').value = '';
    };
    reader.readAsDataURL(file);
  },

  // ── EQUIPO ──
  renderEquipo() {
    const list = document.getElementById('list-equipo');
    if (!list) return;
    const members = JSON.parse(localStorage.getItem('unho_team') || '[]');
    if (members.length === 0) {
      list.innerHTML = '<p style="color:var(--gray);font-size:13px;padding:1rem 0;">Sin colaboradores agregados aun.</p>';
      return;
    }
    list.innerHTML = members.map((m, i) => `
      <div class="li-item" style="align-items:flex-start;gap:16px;">
        <div style="flex-shrink:0;">
          ${m.driveId
            ? `<img src="https://drive.google.com/thumbnail?id=${m.driveId}&sz=w80" style="width:60px;height:60px;border-radius:10px;object-fit:cover;border:2px solid var(--border);" onerror="this.src='';">`
            : `<div style="width:60px;height:60px;border-radius:10px;background:rgba(28,60,110,0.08);display:flex;align-items:center;justify-content:center;"><svg width="24" height="24" fill="none" stroke="rgba(28,60,110,0.3)" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`
          }
        </div>
        <div style="flex:1;">
          <h4>${m.nombre}</h4>
          <p>${m.cargo}</p>
          ${m.driveId ? '<span style="font-size:11px;color:var(--green);font-weight:700;">Foto cargada desde Drive</span>' : '<span style="font-size:11px;color:#9CA3AF;">Sin foto</span>'}
        </div>
        <div class="li-actions">
          <button class="btn-del" onclick="UNHO.deleteTeamMember(${i})">Eliminar</button>
        </div>
      </div>`).join('');
    this.updateStats();
  },

  addTeamMember() {
    const nombre = document.getElementById('inp-team-nombre').value.trim();
    const cargo = document.getElementById('inp-team-cargo').value.trim();
    const descripcion = document.getElementById('inp-team-desc').value.trim();
    const driveInput = document.getElementById('inp-team-drive');
    const driveId = driveInput.value.trim();
    const base64 = driveInput.dataset.base64 || '';

    if (!nombre) { alert('Ingresa el nombre del colaborador'); return; }
    if (!cargo) { alert('Ingresa el cargo o area'); return; }

    const members = JSON.parse(localStorage.getItem('unho_team') || '[]');
    members.push({ nombre, cargo, descripcion, driveId, base64 });
    localStorage.setItem('unho_team', JSON.stringify(members));

    // Clear form
    document.getElementById('inp-team-nombre').value = '';
    document.getElementById('inp-team-cargo').value = '';
    document.getElementById('inp-team-desc').value = '';
    document.getElementById('inp-team-drive').value = '';
    document.getElementById('foto-team-preview').style.display = 'none';

    this.renderEquipo();
    this.showMsg('msg-equipo');
  },

  deleteTeamMember(index) {
    if (!confirm('¿Eliminar este colaborador?')) return;
    const members = JSON.parse(localStorage.getItem('unho_team') || '[]');
    members.splice(index, 1);
    localStorage.setItem('unho_team', JSON.stringify(members));
    this.renderEquipo();
  },

  previewTeamFoto() {
    const id = document.getElementById('inp-team-drive').value.trim();
    if (!id) { alert('Ingresa el ID del archivo de Drive primero'); return; }
    const img = document.getElementById('team-prev-img');
    img.src = 'https://drive.google.com/thumbnail?id=' + id + '&sz=w200';
    document.getElementById('foto-team-preview').style.display = 'block';
  },

  handleTeamFileUpload(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      // Store base64 in a temp field to show preview
      const preview = document.getElementById('team-prev-img');
      preview.src = e.target.result;
      document.getElementById('foto-team-preview').style.display = 'block';
      // Store the base64 in a data attribute for later use
      document.getElementById('inp-team-drive').dataset.base64 = e.target.result;
      document.getElementById('inp-team-drive').value = ''; // clear drive id since using file
    };
    reader.readAsDataURL(file);
  },



  // ── PARTICIPA ──
  renderParticipa() {
    const list = document.getElementById('list-participa');
    if (!list) return;
    const fotos = JSON.parse(localStorage.getItem('unho_participa') || '[]');
    if (fotos.length === 0) {
      list.innerHTML = '<p style="color:var(--gray);font-size:13px;padding:1rem 0;">Sin tarjetas adicionales.</p>';
      return;
    }
    list.innerHTML = fotos.map((f, i) => {
      const src = f.base64 || (f.driveId ? `https://drive.google.com/thumbnail?id=${f.driveId}&sz=w120` : '');
      return `<div class="li-item" style="gap:14px;align-items:flex-start;">
        ${src ? `<img src="${src}" style="width:80px;height:60px;border-radius:8px;object-fit:cover;flex-shrink:0;">` : '<div style="width:80px;height:60px;border-radius:8px;background:#f0f0f0;flex-shrink:0;"></div>'}
        <div style="flex:1;"><h4>${f.titulo || 'Sin titulo'}</h4><p>${f.descripcion || ''}</p></div>
        <button class="btn-del" onclick="UNHO.deleteParticipa(${i})">Eliminar</button>
      </div>`;
    }).join('');
  },

  addParticipa() {
    const titulo = document.getElementById('inp-part-titulo').value.trim();
    const descripcion = document.getElementById('inp-part-desc').value.trim();
    const driveId = document.getElementById('inp-part-drive').value.trim();
    const base64 = document.getElementById('inp-part-drive').dataset.base64 || '';
    if (!titulo) { alert('Ingresa el titulo de la tarjeta'); return; }
    const fotos = JSON.parse(localStorage.getItem('unho_participa') || '[]');
    fotos.push({ titulo, descripcion, driveId, base64 });
    localStorage.setItem('unho_participa', JSON.stringify(fotos));
    document.getElementById('inp-part-titulo').value = '';
    document.getElementById('inp-part-desc').value = '';
    document.getElementById('inp-part-drive').value = '';
    delete document.getElementById('inp-part-drive').dataset.base64;
    document.getElementById('part-foto-preview').style.display = 'none';
    this.renderParticipa();
    this.showMsg('msg-participa');
  },

  deleteParticipa(i) {
    if (!confirm('Eliminar esta tarjeta?')) return;
    const fotos = JSON.parse(localStorage.getItem('unho_participa') || '[]');
    fotos.splice(i, 1);
    localStorage.setItem('unho_participa', JSON.stringify(fotos));
    this.renderParticipa();
  },

  handlePartFileUpload(input) {
    const file = input.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      document.getElementById('part-prev-img').src = e.target.result;
      document.getElementById('part-foto-preview').style.display = 'flex';
      document.getElementById('inp-part-drive').dataset.base64 = e.target.result;
      document.getElementById('inp-part-drive').value = '';
    };
    reader.readAsDataURL(file);
  },

  previewPartFoto() {
    const id = document.getElementById('inp-part-drive').value.trim();
    if (!id) { alert('Ingresa el ID de Drive'); return; }
    document.getElementById('part-prev-img').src = `https://drive.google.com/thumbnail?id=${id}&sz=w300`;
    document.getElementById('part-foto-preview').style.display = 'flex';
  },

  // ── GALERIA ──
  renderGaleria() {
    const list = document.getElementById('list-galeria');
    if (!list) return;
    const fotos = JSON.parse(localStorage.getItem('unho_galeria') || '[]');
    if (fotos.length === 0) {
      list.innerHTML = '<p style="color:var(--gray);font-size:13px;padding:1rem 0;">Sin fotos agregadas aun.</p>';
      return;
    }
    list.innerHTML = fotos.map((f, i) => {
      const imgSrc = f.base64
        ? f.base64
        : f.driveId
          ? `https://drive.google.com/thumbnail?id=${f.driveId}&sz=w120`
          : '';
      return `<div class="li-item" style="align-items:flex-start;gap:14px;">
        <div style="width:80px;height:65px;border-radius:8px;overflow:hidden;background:#f0f0f0;flex-shrink:0;display:flex;align-items:center;justify-content:center;">
          ${imgSrc ? `<img src="${imgSrc}" style="width:100%;height:100%;object-fit:cover;">` : '<svg width="24" height="24" fill="none" stroke="#ccc" stroke-width="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>'}
        </div>
        <div style="flex:1;min-width:0;">
          <h4>${f.descripcion || 'Sin descripcion'}</h4>
          <p style="font-size:11px;margin-top:3px;">${f.driveId ? 'Imagen de Google Drive' : f.base64 ? 'Imagen subida directamente' : 'Sin imagen'}</p>
        </div>
        <div class="li-actions" style="flex-direction:column;gap:6px;">
          <button class="btn-del" onclick="UNHO.deleteFoto(${i})">Eliminar</button>
        </div>
      </div>`;
    }).join('');
  },

  addFoto() {
    const descripcion = document.getElementById('inp-gal-desc').value.trim();
    const driveId = document.getElementById('inp-gal-drive').value.trim();
    const base64 = document.getElementById('inp-gal-drive').dataset.base64 || '';

    if (!driveId && !base64) { alert('Sube una foto o ingresa el ID de Drive'); return; }

    const fotos = JSON.parse(localStorage.getItem('unho_galeria') || '[]');
    fotos.push({ descripcion, driveId, base64 });
    localStorage.setItem('unho_galeria', JSON.stringify(fotos));

    document.getElementById('inp-gal-desc').value = '';
    document.getElementById('inp-gal-drive').value = '';
    delete document.getElementById('inp-gal-drive').dataset.base64;
    document.getElementById('gal-foto-preview').style.display = 'none';

    this.renderGaleria();
    this.showMsg('msg-galeria');
  },

  deleteFoto(index) {
    if (!confirm('¿Eliminar esta foto de la galeria?')) return;
    const fotos = JSON.parse(localStorage.getItem('unho_galeria') || '[]');
    fotos.splice(index, 1);
    localStorage.setItem('unho_galeria', JSON.stringify(fotos));
    this.renderGaleria();
  },

  handleGalFileUpload(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('gal-prev-img').src = e.target.result;
      document.getElementById('gal-foto-preview').style.display = 'flex';
      document.getElementById('inp-gal-drive').dataset.base64 = e.target.result;
      document.getElementById('inp-gal-drive').value = '';
    };
    reader.readAsDataURL(file);
  },

  previewGalFoto() {
    const id = document.getElementById('inp-gal-drive').value.trim();
    if (!id) { alert('Ingresa el ID de Drive'); return; }
    document.getElementById('gal-prev-img').src = `https://drive.google.com/thumbnail?id=${id}&sz=w300`;
    document.getElementById('gal-foto-preview').style.display = 'flex';
  },

  // ── FOTO GALERÍA ──
  previewFoto() {
    const id = document.getElementById('inp-drive-id').value.trim();
    if (!id) { alert('Ingresa el ID del archivo de Drive'); return; }
    const url = 'https://drive.google.com/thumbnail?id=' + id + '&sz=w400';
    document.getElementById('prev-img').src = url;
    document.getElementById('foto-preview').style.display = 'block';
  },

  // ── UTILS ──
  deleteItem(type, id) {
    if (!confirm('¿Eliminar este elemento?')) return;
    this.state.data[type] = this.state.data[type].filter(i => i.id !== id);
    if (type === 'proyectos') this.renderProyectos();
    if (type === 'noticias') this.renderNoticias();
    if (type === 'convocatorias') this.renderConvocatorias();
    if (type === 'empleos') this.renderEmpleos();
  },

  showMsg(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 3000);
  },

  saveContacto() {
    this.showMsg('msg-contacto');
  }
};

document.addEventListener('DOMContentLoaded', () => UNHO.init());
