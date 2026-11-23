// ==================== DETALLE DEL JUEGO ====================
const detailTitle = document.getElementById('detail_title');

const paramsUrl = new URLSearchParams(window.location.search);
const juegoId = paramsUrl.get('id');
const steamAppId = paramsUrl.get('steamAppId');

let juegoActual = null;

function mostrarJuego(juego) {
  document.title = `${juego.titulo} | MyGameList`;
  detailTitle.textContent = juego.titulo;

  const generosTexto = Array.isArray(juego.generos) && juego.generos.length > 0
    ? juego.generos.join(', ')
    : 'Sin género';

  const subtitleEl = document.getElementById('detail_subtitle');
  if (subtitleEl) {
    subtitleEl.textContent = `${juego.anioSalida || 'N/D'}  |  ${generosTexto}`;
  }

  // Portada
  const cover = document.getElementById('detail_cover');
  if (juego.caratula && cover) {
    const img = document.createElement('img');
    img.id = 'detail_cover';
    img.src = juego.caratula;
    img.alt = juego.titulo;
    img.className = 'rounded-3 shadow-sm';
    img.style.width = '320px';
    img.style.maxWidth = '100%';
    cover.replaceWith(img);
  }

  // Badges de plataforma
  const plataformas = Array.isArray(juego.plataformas) && juego.plataformas.length > 0
    ? juego.plataformas
    : ['PC'];

  const badges = document.getElementById('detail_badges');
  if (badges) {
    badges.innerHTML = '';
    plataformas.forEach((plataforma) => {
      const span = document.createElement('span');
      span.className = 'badge text-bg-secondary px-3 py-2 rounded-pill fw-medium';
      span.textContent = plataforma;
      badges.appendChild(span);
    });
  }

  // Pestaña de información
  const synopsisEl = document.getElementById('detail_synopsis');
  if (synopsisEl) synopsisEl.textContent = juego.sinopsis || 'Sin sinopsis disponible.';

  const platformsEl = document.getElementById('detail_platforms');
  if (platformsEl) platformsEl.textContent = plataformas.join(', ');

  const yearEl = document.getElementById('detail_year');
  if (yearEl) yearEl.textContent = juego.anioSalida || 'N/D';

  const hoursEl = document.getElementById('detail_hours');
  if (hoursEl) hoursEl.textContent = `${juego.promedioHoras ?? 0} h`;

  const favoritesEl = document.getElementById('detail_favorites');
  if (favoritesEl) favoritesEl.textContent = (juego.numeroFavoritos ?? 0).toLocaleString('es-MX');
}

// Pide y muestra las estadísticas de la comunidad
async function cargarEstadisticas() {
  const idJuego = juegoActual?._id || juegoId;
  if (!idJuego) return;

  try {
    const response = await fetch(`${API_URL}/games/${idJuego}/stats`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.mensaje);

    const stats = result.estadisticas;
    document.getElementById('stats_playing').textContent = stats.jugando;
    document.getElementById('stats_completed').textContent = stats.completados;
    document.getElementById('stats_planned').textContent = stats.planeados;
    document.getElementById('stats_dropped').textContent = stats.abandonados;
  } catch (err) {
    console.error('Error en estadísticas:', err);
  }
}

async function cargarDetalle() {
  if (!juegoId && !steamAppId) {
    detailTitle.textContent = 'No se indicó ningún juego';
    return;
  }

  if (typeof showLoading === 'function') showLoading('Cargando detalle del juego...');
  try {
    // Si viene desde index.html (?steamAppId=), consulta Steam y lo guarda en MongoDB
    const endpoint = juegoId
      ? `${API_URL}/games/${juegoId}`
      : `${API_URL}/steam/game/${steamAppId}`;

    const response = await fetch(endpoint);
    const result = await response.json();

    if (!response.ok || !result.juego) {
      throw new Error(result.mensaje || 'No se pudo cargar el juego');
    }

    juegoActual = result.juego;
    mostrarJuego(juegoActual);
    await cargarEstadisticas();
  } catch (err) {
    console.error('Error en detalle:', err);
    detailTitle.textContent = 'Juego no encontrado';
    alert('No se pudo cargar el juego: ' + err.message);
  } finally {
    if (typeof hideLoading === 'function') hideLoading();
  }
}

// ==================== AGREGAR / ACTUALIZAR EN MI LISTA (POST y PATCH /api/mylist) ====================
const ETIQUETAS_ESTADO = {
  playing: 'Jugando',
  completed: 'Completado',
  planned: 'Planeado',
  dropped: 'Abandonado'
};

let itemEnMiLista = null;

function actualizarBotonLista(estado) {
  const btnPrincipal = document.getElementById('btn_add_mylist') || document.querySelector('main .btn-group > button:first-child');
  const btnToggle = document.getElementById('btn_toggle_mylist') || document.querySelector('main .btn-group > .dropdown-toggle');
  if (!btnPrincipal) return;

  btnPrincipal.classList.remove('btn-primary');
  btnPrincipal.classList.add('btn-success');
  if (btnToggle) {
    btnToggle.classList.remove('btn-primary');
    btnToggle.classList.add('btn-success');
  }

  const texto = ETIQUETAS_ESTADO[estado] || 'En mi lista';
  btnPrincipal.innerHTML = `<i class="bi bi-check-lg me-1"></i> ${texto}`;
}

async function verificarEstadoEnMiLista() {
  const user = JSON.parse(sessionStorage.getItem('user') || 'null');
  if (!user || !juegoActual) return;

  const usuarioId = user._id || user.id;
  try {
    const response = await fetch(`${API_URL}/mylist?usuarioId=${encodeURIComponent(usuarioId)}`);
    const data = await response.json();
    if (!response.ok || !data.ok || !Array.isArray(data.juegos)) return;

    // Buscar si el juego ya está en la lista del usuario
    const encontrado = data.juegos.find((item) => {
      if (juegoActual._id && item.juegoId && String(item.juegoId) === String(juegoActual._id)) return true;
      if (juegoActual.steamAppId && item.steamAppId && Number(item.steamAppId) === Number(juegoActual.steamAppId)) return true;
      return item.titulo && juegoActual.titulo && item.titulo.trim().toLowerCase() === juegoActual.titulo.trim().toLowerCase();
    });

    if (encontrado) {
      itemEnMiLista = encontrado;
      actualizarBotonLista(encontrado.estado);
    }
  } catch (err) {
    console.error('Error al verificar estado en mi lista:', err);
  }
}

async function agregarAMiLista(estado = 'playing') {
  const user = JSON.parse(sessionStorage.getItem('user') || 'null');
  if (!user) {
    alert('Inicia sesión para agregar juegos a tu lista.');
    window.location.href = 'login.html';
    return;
  }

  if (!juegoActual) {
    alert('Espera a que termine de cargar la información del juego.');
    return;
  }

  const usuarioId = user._id || user.id;
  const plataformaPrincipal = Array.isArray(juegoActual.plataformas) && juegoActual.plataformas.length > 0
    ? juegoActual.plataformas[0]
    : 'PC';

  if (typeof showLoading === 'function') showLoading('Guardando en tu lista...');
  try {
    let response;
    let result;

    if (itemEnMiLista && itemEnMiLista._id) {
      // Si ya existe, actualiza su estado
      response = await fetch(`${API_URL}/mylist/${itemEnMiLista._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado })
      });
      result = await response.json();
    } else {
      // Si no existe, crea una nueva entrada
      const payload = {
        usuarioId,
        juegoId: juegoActual._id,
        steamAppId: juegoActual.steamAppId,
        titulo: juegoActual.titulo,
        caratula: juegoActual.caratula || '',
        plataforma: plataformaPrincipal,
        estado
      };

      response = await fetch(`${API_URL}/mylist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      result = await response.json();
    }

    if (!response.ok || !result.ok) {
      throw new Error(result.mensaje || 'No se pudo guardar el juego en tu lista.');
    }

    itemEnMiLista = result.juego || itemEnMiLista;
    actualizarBotonLista(estado);
    await cargarEstadisticas();
    alert(`"${juegoActual.titulo}" se guardó en tu lista como "${ETIQUETAS_ESTADO[estado]}".`);
  } catch (err) {
    console.error('Error al guardar en mi lista:', err);
    alert(err.message);
  } finally {
    if (typeof hideLoading === 'function') hideLoading();
  }
}

function inicializarEventosLista() {
  const btnPrincipal = document.getElementById('btn_add_mylist') || document.querySelector('main .btn-group > button:first-child');
  if (btnPrincipal) {
    btnPrincipal.addEventListener('click', () => {
      const estadoActual = itemEnMiLista ? itemEnMiLista.estado : 'playing';
      agregarAMiLista(estadoActual);
    });
  }

  const mapaEstados = {
    jugando: 'playing',
    completado: 'completed',
    planeado: 'planned',
    abandonado: 'dropped'
  };

  const menuItems = document.querySelectorAll('#dropdown_mylist_menu .dropdown-item, main .btn-group .dropdown-menu .dropdown-item');
  menuItems.forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const estadoData = item.dataset.estado;
      const texto = item.textContent.trim().toLowerCase();
      const estado = estadoData || mapaEstados[texto] || 'playing';
      agregarAMiLista(estado);
    });
  });
}

async function cargarDetalleCompleto() {
  await cargarDetalle();
  await verificarEstadoEnMiLista();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    cargarDetalleCompleto();
    inicializarEventosLista();
  });
} else {
  cargarDetalleCompleto();
  inicializarEventosLista();
}