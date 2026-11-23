// FRONTEND/controllers/profile_controller.js

function obtenerUsuarioActual() {
    const raw = sessionStorage.getItem('user');
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

async function cargarEstadisticasYFavoritosPerfil() {
    const usuario = obtenerUsuarioActual();
    if (!usuario) return;

    const usuarioId = usuario._id || usuario.id;

    const statGames = document.getElementById('stat_total_games');
    const statCompleted = document.getElementById('stat_completed_games');
    const statHours = document.getElementById('stat_total_hours');
    const favCount = document.getElementById('favorites_count');
    const favGrid = document.getElementById('favorites_grid');

    try {
        const response = await fetch(`${API_URL}/mylist?usuarioId=${encodeURIComponent(usuarioId)}`);
        const data = await response.json();

        if (!response.ok || !data.ok || !Array.isArray(data.juegos)) {
            throw new Error(data.mensaje || 'No se pudieron cargar los datos del perfil.');
        }

        const juegos = data.juegos;
        const contadores = data.contadores || {};

        // 1. Estadísticas
        const totalJuegos = juegos.length;
        const completados = contadores.completed ?? juegos.filter(j => j.estado === 'completed').length;
        const totalHoras = juegos.reduce((acum, j) => acum + (Number(j.horasJugadas) || 0), 0);

        if (statGames) statGames.textContent = totalJuegos;
        if (statCompleted) statCompleted.textContent = completados;
        if (statHours) statHours.textContent = `${totalHoras} h`;

        // 2. Favoritos
        const favoritos = juegos.filter(j => Boolean(j.esFavorito));
        if (favCount) favCount.textContent = favoritos.length;

        if (favGrid) {
            if (favoritos.length === 0) {
                favGrid.innerHTML = `
                    <div class="col-12 text-center py-4 text-secondary">
                        <i class="bi bi-heart fs-2 opacity-50 d-block mb-2"></i>
                        <p class="mb-1 fw-semibold">Aún no has marcado videojuegos como favoritos.</p>
                        <small>Ve a <a href="my-list.html" class="text-decoration-none">Mi Lista</a> o al <a href="catalog.html" class="text-decoration-none">Catálogo</a> y márcalos con el ícono de corazón.</small>
                    </div>
                `;
            } else {
                favGrid.innerHTML = favoritos.map(fav => {
                    let hrefDetalle = 'catalog.html';
                    if (fav.juegoId) {
                        hrefDetalle = `game-detail.html?id=${encodeURIComponent(fav.juegoId)}`;
                    } else if (fav.steamAppId) {
                        hrefDetalle = `game-detail.html?steamAppId=${encodeURIComponent(fav.steamAppId)}`;
                    }

                    const imagenHTML = fav.caratula
                        ? `<img src="${fav.caratula}" alt="${fav.titulo}" class="w-100 rounded-3 shadow-sm" style="aspect-ratio: 4 / 5; object-fit: cover;">`
                        : `<div class="img-placeholder text-secondary"><i class="bi bi-controller fs-2 opacity-50"></i></div>`;

                    return `
                        <div class="col">
                            <a href="${hrefDetalle}" class="text-decoration-none text-dark">
                                <div class="card h-100 border-0 bg-transparent">
                                    ${imagenHTML}
                                    <div class="card-body px-1 pt-2 pb-0">
                                        <h6 class="card-title fw-semibold text-dark mb-0 small text-truncate" title="${fav.titulo}">${fav.titulo}</h6>
                                        <span class="badge bg-secondary-subtle text-secondary small">${fav.plataforma}</span>
                                    </div>
                                </div>
                            </a>
                        </div>
                    `;
                }).join('');
            }
        }
    } catch (err) {
        console.error('Error al cargar datos del perfil:', err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    cargarEstadisticasYFavoritosPerfil();
});
