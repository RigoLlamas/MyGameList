// FRONTEND/controllers/index_controller.js

function toggleHomeLoading(show) {
  const lottieOverlay = document.getElementById('loading_overlay');
  if (lottieOverlay) {
    lottieOverlay.style.display = show ? 'flex' : 'none';
  }
  if (show && typeof showLoading === 'function') {
    showLoading('Cargando juegos destacados...');
  } else if (!show && typeof hideLoading === 'function') {
    hideLoading();
  }
}

function renderizarPopulares(juegos) {
  const grid = document.getElementById('popularGamesGrid');
  if (!grid) return;

  const principal = juegos[0];
  const secundarios = juegos.slice(1, 5);

  const imgPrincipal = principal.caratula
    ? `<img src="${principal.caratula}" alt="${principal.titulo}" class="w-100 h-100" style="min-height: 360px; object-fit: cover;">`
    : `<div class="img-placeholder text-secondary w-100 h-100" style="min-height: 360px;"><i class="bi bi-image fs-1 opacity-50"></i></div>`;

  const cardPrincipalHTML = `
    <div class="col-lg-6">
      <a href="game-detail.html?steamAppId=${principal.steamAppId}" class="text-decoration-none">
        <div class="card h-100 border-0 shadow rounded-4 overflow-hidden position-relative bg-dark text-white">
          ${imgPrincipal}
          <div class="position-absolute bottom-0 start-0 end-0 p-4"
               style="background: linear-gradient(to top, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.45), transparent);">
            <span class="badge bg-warning text-dark fw-bold mb-2">#1 Más Popular</span>
            <h3 class="fw-bold mb-1">${principal.titulo}</h3>
            <small class="text-light opacity-75">Ver detalles y agregar a mi lista <i class="bi bi-chevron-right"></i></small>
          </div>
        </div>
      </a>
    </div>
  `;

  const cardsSecundariasHTML = `
    <div class="col-lg-6">
      <div class="row row-cols-1 row-cols-sm-2 g-3 h-100">
        ${secundarios.map((juego, idx) => {
          const imagenHTML = juego.caratula
            ? `<img src="${juego.caratula}" alt="${juego.titulo}" class="card-img-top" style="aspect-ratio: 16 / 9; object-fit: cover;">`
            : `<div class="img-placeholder text-secondary" style="aspect-ratio: 16 / 9;"><i class="bi bi-image fs-2 opacity-50"></i></div>`;

          return `
            <div class="col">
              <a href="game-detail.html?steamAppId=${juego.steamAppId}" class="text-decoration-none">
                <div class="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
                  <div class="position-relative">
                    ${imagenHTML}
                    <span class="badge bg-dark bg-opacity-75 position-absolute top-0 start-0 m-2">#${idx + 2}</span>
                  </div>
                  <div class="card-body p-3">
                    <h6 class="card-title fw-bold text-dark mb-0">${juego.titulo}</h6>
                  </div>
                </div>
              </a>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  grid.innerHTML = cardPrincipalHTML + cardsSecundariasHTML;
}

function renderizarRecientes(recientes) {
  const grid = document.getElementById('recentGamesGrid');
  if (!grid) return;

  if (!Array.isArray(recientes) || recientes.length === 0) {
    grid.innerHTML = '<div class="col-12 text-secondary">No hay lanzamientos recientes disponibles por el momento.</div>';
    return;
  }

  grid.innerHTML = recientes.map((juego) => {
    const imagenHTML = juego.caratula
      ? `<img src="${juego.caratula}" alt="${juego.titulo}" class="card-img-top" style="aspect-ratio: 16 / 9; object-fit: cover;">`
      : `<div class="img-placeholder text-secondary" style="aspect-ratio: 16 / 9;"><i class="bi bi-image fs-1 opacity-50"></i></div>`;

    return `
      <div class="col">
        <a href="game-detail.html?steamAppId=${juego.steamAppId}" class="text-decoration-none">
          <div class="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
            <div class="position-relative">
              ${imagenHTML}
              <span class="badge bg-success position-absolute top-0 end-0 m-2">Nuevo</span>
            </div>
            <div class="card-body p-3">
              <h6 class="card-title fw-bold text-dark mb-1">${juego.titulo}</h6>
              <small class="text-secondary">Disponible en Steam</small>
            </div>
          </div>
        </a>
      </div>
    `;
  }).join('');
}

async function cargarJuegosPopulares() {
  const grid = document.getElementById('popularGamesGrid');
  if (!grid) return;

  // Resuelve la URL base independientemente de cómo esté configurado env.js
  const baseApi = typeof API_URL !== 'undefined'
    ? API_URL
    : `${typeof local_url !== 'undefined' ? local_url : 'http://localhost:3000/'}api`;

  toggleHomeLoading(true);

  try {
    const response = await fetch(`${baseApi}/steam/popular`);
    const data = await response.json();

    if (!response.ok || !data.ok || !Array.isArray(data.juegos) || data.juegos.length === 0) {
      throw new Error(data.mensaje || 'No se pudieron obtener los juegos populares.');
    }

    renderizarPopulares(data.juegos);
    renderizarRecientes(data.recientes || []);
  } catch (error) {
    console.error('Error cargando juegos populares:', error);
    grid.innerHTML = `
      <div class="col-12">
        <div class="alert alert-warning d-flex align-items-center justify-content-between" role="alert">
          <span><i class="bi bi-exclamation-triangle me-2"></i>No se pudieron cargar los juegos de Steam en este momento.</span>
          <button type="button" class="btn btn-sm btn-outline-dark" onclick="cargarJuegosPopulares()">Reintentar</button>
        </div>
      </div>
    `;
  } finally {
    toggleHomeLoading(false);
  }
}

document.addEventListener('DOMContentLoaded', cargarJuegosPopulares);