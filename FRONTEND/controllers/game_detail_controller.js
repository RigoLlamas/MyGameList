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
  } catch (err) {
    console.error('Error en detalle:', err);
    detailTitle.textContent = 'Juego no encontrado';
    alert('No se pudo cargar el juego: ' + err.message);
  } finally {
    if (typeof hideLoading === 'function') hideLoading();
  }
}

// ==================== AGREGAR A MI LISTA (POST /api/mylist) ====================
const ETIQUETAS_ESTADO = {
  playing: 'Jugando',
  completed: 'Completado',
  planned: 'Planeado',
  dropped: 'Abandonado'
};

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

  const plataformaPrincipal = Array.isArray(juegoActual.plataformas) && juegoActual.plataformas.length > 0
    ? juegoActual.plataformas[0]
    : 'PC';

  const payload = {
    usuarioId: user._id || user.id,
    juegoId: juegoActual._id,
    steamAppId: juegoActual.steamAppId,
    titulo: juegoActual.titulo,
    caratula: juegoActual.caratula || '',
    plataforma: plataformaPrincipal,
    estado
  };

  if (typeof showLoading === 'function') showLoading('Agregando a tu lista...');
  try {
    const response = await fetch(`${API_URL}/mylist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.mensaje || 'No se pudo agregar el juego a tu lista.');
    }

    const btnPrincipal = document.querySelector('main .btn-group > button:first-child');
    if (btnPrincipal) {
      btnPrincipal.classList.remove('btn-primary');
      btnPrincipal.classList.add('btn-success');
      btnPrincipal.innerHTML = `<i class="bi bi-check-lg me-1"></i> ${ETIQUETAS_ESTADO[estado] || 'En mi lista'}`;
    }

    alert(`"${juegoActual.titulo}" se agregó a tu lista como "${ETIQUETAS_ESTADO[estado]}".`);
  } catch (err) {
    console.error('Error al agregar a mi lista:', err);
    alert(err.message);
  } finally {
    if (typeof hideLoading === 'function') hideLoading();
  }
}

function inicializarEventosLista() {
  const btnGroup = document.querySelector('main .btn-group');
  if (!btnGroup) return;

  // Botón principal ("Agregar a mi lista") -> agrega por defecto en "playing" (Jugando)
  const btnPrincipal = btnGroup.querySelector('button:first-child');
  if (btnPrincipal) {
    btnPrincipal.addEventListener('click', () => agregarAMiLista('playing'));
  }

  // Opciones del menú desplegable (Jugando, Completado, Planeado, Abandonado)
  const mapaEstados = {
    jugando: 'playing',
    completado: 'completed',
    planeado: 'planned',
    abandonado: 'dropped'
  };

  btnGroup.querySelectorAll('.dropdown-menu .dropdown-item').forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const texto = item.textContent.trim().toLowerCase();
      const estado = item.dataset.estado || mapaEstados[texto] || 'playing';
      agregarAMiLista(estado);
    });
  });
}

if (detailTitle) {
  cargarDetalle();
  inicializarEventosLista();
}