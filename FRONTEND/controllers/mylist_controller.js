// FRONTEND/controllers/mylist_controller.js

let listaJuegos = [];
let filtroEstadoActual = 'all'; // 'all', 'playing', 'completed', 'planned', 'dropped'
let idJuegoEnEdicion = null;

// Mapa de clases para plataformas conocidas
const MAPA_BADGES_PLATAFORMA = {
  pc: 'badge-pc',
  switch: 'badge-switch',
  ps5: 'badge-ps5',
  ps4: 'badge-ps5',
  playstation: 'badge-ps5',
  xbox: 'badge-xbox',
  wiiu: 'badge-wiiu'
};

function obtenerClasePlataforma(plataforma = '') {
  const clave = plataforma.trim().toLowerCase();
  for (const [k, v] of Object.entries(MAPA_BADGES_PLATAFORMA)) {
    if (clave.includes(k)) return v;
  }
  return 'bg-secondary text-white';
}

function obtenerUsuarioAutenticado() {
  const rawUser = sessionStorage.getItem('user');
  if (!rawUser) return null;
  try {
    return JSON.parse(rawUser);
  } catch (e) {
    return null;
  }
}

// Carga la lista del usuario desde la API
async function cargarMiLista() {
  const user = obtenerUsuarioAutenticado();
  if (!user) {
    alert('Debes iniciar sesión para ver tu lista.');
    window.location.href = 'login.html';
    return;
  }

  const usuarioId = user._id || user.id;
  if (typeof showLoading === 'function') showLoading();

  try {
    const url = `${API_URL}/mylist?usuarioId=${encodeURIComponent(usuarioId)}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.mensaje || 'Error al cargar tu lista.');
    }

    listaJuegos = Array.isArray(data.juegos) ? data.juegos : [];
    actualizarContadoresFiltros(data.contadores || {});
    renderizarTabla();
  } catch (err) {
    console.error('Error cargando Mi Lista:', err);
    renderizarError(err.message);
  } finally {
    if (typeof hideLoading === 'function') hideLoading();
  }
}

// Actualiza los badges de los botones de filtro
function actualizarContadoresFiltros(contadores = {}) {
  const badgePlaying = document.getElementById('count_playing');
  const badgeCompleted = document.getElementById('count_completed');
  const badgePlanned = document.getElementById('count_planned');
  const badgeDropped = document.getElementById('count_dropped');

  if (badgePlaying) badgePlaying.textContent = contadores.playing ?? 0;
  if (badgeCompleted) badgeCompleted.textContent = contadores.completed ?? 0;
  if (badgePlanned) badgePlanned.textContent = contadores.planned ?? 0;
  if (badgeDropped) badgeDropped.textContent = contadores.dropped ?? 0;
}

// Dibuja las filas de la tabla
function renderizarTabla() {
  const tbody = document.getElementById('mylist_tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  const juegosFiltrados = listaJuegos.filter((juego) => {
    if (filtroEstadoActual === 'all') return true;
    return juego.estado === filtroEstadoActual;
  });

  if (juegosFiltrados.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-5 text-secondary">
          <i class="bi bi-controller fs-1 d-block mb-2 opacity-50"></i>
          <p class="mb-2 fw-semibold">No tienes juegos en esta sección.</p>
          <a href="catalog.html" class="btn btn-outline-primary btn-sm rounded-pill px-3">Explorar Catálogo</a>
        </td>
      </tr>
    `;
    return;
  }

  juegosFiltrados.forEach((item) => {
    const tr = document.createElement('tr');
    const claseBadge = obtenerClasePlataforma(item.plataforma);
    const progreso = Number(item.progreso) || 0;
    const horas = Number(item.horasJugadas) || 0;
    const esFavorito = Boolean(item.esFavorito);

    // Enlace a detalle (si tiene id de juego o steamAppId)
    let hrefDetalle = 'catalog.html';
    if (item.juegoId) {
      hrefDetalle = `game-detail.html?id=${encodeURIComponent(item.juegoId)}`;
    } else if (item.steamAppId) {
      hrefDetalle = `game-detail.html?steamAppId=${encodeURIComponent(item.steamAppId)}`;
    }

    tr.innerHTML = `
      <td class="px-3 fw-semibold">
        <div class="d-flex align-items-center gap-2">
          ${esFavorito ? '<i class="bi bi-heart-fill text-danger" title="Favorito"></i>' : ''}
          <a href="${hrefDetalle}" class="text-decoration-none text-dark hover-primary">${item.titulo}</a>
        </div>
      </td>
      <td>
        <span class="badge ${claseBadge} rounded-pill px-3 py-2">${item.plataforma}</span>
      </td>
      <td>${horas} h</td>
      <td>
        <div class="d-flex align-items-center gap-2" style="max-width: 220px;">
          <div class="progress flex-grow-1" style="height: 10px;" role="progressbar" aria-valuenow="${progreso}" aria-valuemin="0" aria-valuemax="100">
            <div class="progress-bar bg-primary" style="width: ${progreso}%;"></div>
          </div>
          <span class="small fw-semibold text-secondary" style="min-width: 38px;">${progreso}%</span>
        </div>
      </td>
      <td class="text-end px-3">
        <div class="dropdown">
          <button class="btn btn-light btn-sm rounded-circle p-2" type="button" data-bs-toggle="dropdown" aria-expanded="false" title="Más opciones">
            <i class="bi bi-three-dots-vertical"></i>
          </button>
          <ul class="dropdown-menu dropdown-menu-end shadow-sm">
            <li><a class="dropdown-item" href="${hrefDetalle}"><i class="bi bi-eye me-2"></i>Ver detalles</a></li>
            <li><a class="dropdown-item btn-abrir-editar" href="#" data-id="${item._id}"><i class="bi bi-pencil me-2"></i>Editar progreso</a></li>
            <li>
              <a class="dropdown-item btn-toggle-fav" href="#" data-id="${item._id}">
                <i class="bi ${esFavorito ? 'bi-heartbreak text-secondary' : 'bi-heart text-danger'} me-2"></i>${esFavorito ? 'Quitar de Favoritos' : 'Marcar como Favorito'}
              </a>
            </li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item text-danger btn-eliminar-juego" href="#" data-id="${item._id}" data-titulo="${item.titulo}"><i class="bi bi-trash me-2"></i>Eliminar de la lista</a></li>
          </ul>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });

  asignarEventosAcciones();
}

function renderizarError(mensaje) {
  const tbody = document.getElementById('mylist_tbody');
  if (!tbody) return;
  tbody.innerHTML = `
    <tr>
      <td colspan="5" class="text-center py-5 text-danger">
        <i class="bi bi-exclamation-triangle fs-2 d-block mb-2"></i>
        <p class="mb-0">Error: ${mensaje}</p>
      </td>
    </tr>
  `;
}

// Configura los listeners en los menús de 3 puntos
function asignarEventosAcciones() {
  // 1. Abrir Modal de Edición
  document.querySelectorAll('.btn-abrir-editar').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = btn.dataset.id;
      abrirModalEdicion(id);
    });
  });

  // 2. Alternar Favorito
  document.querySelectorAll('.btn-toggle-fav').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const id = btn.dataset.id;
      await alternarFavorito(id);
    });
  });

  // 3. Eliminar de la lista
  document.querySelectorAll('.btn-eliminar-juego').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const id = btn.dataset.id;
      const titulo = btn.dataset.titulo || 'este juego';
      if (confirm(`¿Estás seguro de que deseas eliminar "${titulo}" de tu lista?`)) {
        await eliminarJuego(id);
      }
    });
  });
}

// Prepara y abre el modal de edición
function abrirModalEdicion(id) {
  const item = listaJuegos.find((j) => String(j._id) === String(id));
  if (!item) return;

  idJuegoEnEdicion = item._id;

  const modalTitulo = document.getElementById('modalGameTitle');
  if (modalTitulo) modalTitulo.textContent = item.titulo;

  const selectStatus = document.getElementById('edit_status');
  if (selectStatus) selectStatus.value = item.estado || 'playing';

  const inputHours = document.getElementById('edit_hours');
  if (inputHours) inputHours.value = item.horasJugadas ?? 0;

  const sliderProgress = document.getElementById('edit_progress');
  const spanProgress = document.getElementById('edit_progress_value');
  const progreso = item.progreso ?? 0;
  if (sliderProgress) sliderProgress.value = progreso;
  if (spanProgress) spanProgress.textContent = progreso;

  const modalEl = document.getElementById('edit_details');
  if (modalEl) {
    const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
    modalInstance.show();
  }
}

// Guarda cambios del progreso del juego
async function guardarProgreso() {
  if (!idJuegoEnEdicion) return;

  const estado = document.getElementById('edit_status')?.value || 'playing';
  const horasJugadas = Number(document.getElementById('edit_hours')?.value) || 0;
  const progreso = Number(document.getElementById('edit_progress')?.value) || 0;

  if (typeof showLoading === 'function') showLoading('Guardando progreso...');
  try {
    const response = await fetch(`${API_URL}/mylist/${idJuegoEnEdicion}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado, horasJugadas, progreso })
    });
    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.mensaje || 'No se pudo actualizar el progreso.');
    }

    const modalEl = document.getElementById('edit_details');
    if (modalEl) {
      const modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (modalInstance) modalInstance.hide();
    }

    // Refrescar lista completa
    await cargarMiLista();
  } catch (err) {
    console.error('Error al guardar progreso:', err);
    alert(err.message);
  } finally {
    if (typeof hideLoading === 'function') hideLoading();
  }
}

// Alternar favorito
async function alternarFavorito(id) {
  if (typeof showLoading === 'function') showLoading();
  try {
    const response = await fetch(`${API_URL}/mylist/${id}/favorite`, {
      method: 'PATCH'
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      throw new Error(result.mensaje || 'Error al cambiar estado de favorito.');
    }

    await cargarMiLista();
  } catch (err) {
    console.error('Error en favorito:', err);
    alert(err.message);
  } finally {
    if (typeof hideLoading === 'function') hideLoading();
  }
}

// Eliminar juego
async function eliminarJuego(id) {
  if (typeof showLoading === 'function') showLoading('Eliminando de tu lista...');
  try {
    const response = await fetch(`${API_URL}/mylist/${id}`, {
      method: 'DELETE'
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      throw new Error(result.mensaje || 'No se pudo eliminar el juego.');
    }

    await cargarMiLista();
  } catch (err) {
    console.error('Error al eliminar juego:', err);
    alert(err.message);
  } finally {
    if (typeof hideLoading === 'function') hideLoading();
  }
}

// Configurar los filtros de estado
function configurarFiltros() {
  const botonesFiltro = document.querySelectorAll('[data-filtro-estado]');
  botonesFiltro.forEach((btn) => {
    btn.addEventListener('click', () => {
      filtroEstadoActual = btn.dataset.filtroEstado;

      // Actualizar estilos activos de los botones
      botonesFiltro.forEach((b) => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-outline-secondary');
        const badge = b.querySelector('.badge');
        if (badge) {
          badge.classList.remove('text-bg-light');
          badge.classList.add('text-bg-secondary');
        }
      });

      btn.classList.remove('btn-outline-secondary');
      btn.classList.add('btn-primary');
      const activeBadge = btn.querySelector('.badge');
      if (activeBadge) {
        activeBadge.classList.remove('text-bg-secondary');
        activeBadge.classList.add('text-bg-light');
      }

      renderizarTabla();
    });
  });
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  configurarFiltros();

  const btnSave = document.getElementById('btnSaveGame');
  if (btnSave) {
    btnSave.addEventListener('click', guardarProgreso);
  }

  cargarMiLista();
});
