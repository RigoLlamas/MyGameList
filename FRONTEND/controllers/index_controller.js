// FRONTEND/controllers/index_controller.js

function toggleHomeLoading(show) {
  const lottieOverlay = document.getElementById('loading_overlay');
  if (lottieOverlay) {
    lottieOverlay.style.display = show ? 'flex' : 'none';
  }
  if (show && typeof showLoading === 'function') {
    showLoading('Cargando juegos populares...');
  } else if (!show && typeof hideLoading === 'function') {
    hideLoading();
  }
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

    const top4 = data.juegos.slice(0, 4);

    grid.innerHTML = top4.map((juego) => {
      const imagenHTML = juego.caratula
        ? `<img src="${juego.caratula}" alt="${juego.titulo}" class="w-100 rounded-3 shadow-sm" style="aspect-ratio: 16 / 9; object-fit: cover;">`
        : `<div class="img-placeholder text-secondary" style="aspect-ratio: 16 / 9;"><i class="bi bi-image fs-1 opacity-50"></i></div>`;

      return `
        <div class="col">
          <a href="game-detail.html?steamAppId=${juego.steamAppId}" class="text-decoration-none">
            <div class="card h-100 border-0 bg-transparent">
              ${imagenHTML}
              <div class="card-body px-0 pt-3">
                <h6 class="card-title fw-bold text-dark mb-0">${juego.titulo}</h6>
              </div>
            </div>
          </a>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error('Error cargando juegos populares:', error);
    grid.innerHTML = `
      <div class="col-12">
        <div class="alert alert-warning d-flex align-items-center justify-content-between" role="alert">
          <span><i class="bi bi-exclamation-triangle me-2"></i>No se pudieron cargar los juegos populares de Steam en este momento.</span>
          <button type="button" class="btn btn-sm btn-outline-dark" onclick="cargarJuegosPopulares()">Reintentar</button>
        </div>
      </div>
    `;
  } finally {
    toggleHomeLoading(false);
  }
}

document.addEventListener('DOMContentLoaded', cargarJuegosPopulares);