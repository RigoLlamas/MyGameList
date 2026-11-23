// ==================== DETALLE DEL JUEGO ====================
const detailTitle = document.getElementById('detail_title');

// Lee el ?id=... de la URL (lo pone el botón "Ver Detalle" del catálogo)
const juegoId = new URLSearchParams(window.location.search).get('id');

let juegoActual = null;   // lo usaremos en el paso 7b (Agregar a mi lista)

function mostrarJuego(juego) {
    document.title = `${juego.titulo} | MyGameList`;
    detailTitle.textContent = juego.titulo;
    document.getElementById('detail_subtitle').textContent =
        `${juego.anioSalida || 'N/D'}  |  ${juego.generos.join(', ') || 'Sin género'}`;

    // Portada
    if (juego.caratula) {
        const img = document.createElement('img');
        img.src = juego.caratula;
        img.alt = juego.titulo;
        img.className = 'rounded-3 shadow-sm';
        img.style.width = '320px';
        img.style.maxWidth = '100%';
        const cover = document.getElementById('detail_cover');
        cover.replaceWith(img);
    }

    // Badges de plataforma
    const badges = document.getElementById('detail_badges');
    badges.innerHTML = '';
    juego.plataformas.forEach(plataforma => {
        const span = document.createElement('span');
        span.className = 'badge text-bg-secondary px-3 py-2 rounded-pill fw-medium';
        span.textContent = plataforma;
        badges.appendChild(span);
    });

    // Pestaña de información
    document.getElementById('detail_synopsis').textContent = juego.sinopsis || 'Sin sinopsis disponible.';
    document.getElementById('detail_platforms').textContent = juego.plataformas.join(', ');
    document.getElementById('detail_year').textContent = juego.anioSalida || 'N/D';
    document.getElementById('detail_hours').textContent = `${juego.promedioHoras} h`;
    document.getElementById('detail_favorites').textContent = juego.numeroFavoritos.toLocaleString('es-MX');
}

// Pide y muestra las estadísticas de la comunidad
async function cargarEstadisticas() {
    try {
        const response = await fetch(`${API_URL}/games/${juegoId}/stats`);
        const result = await response.json();
        if (!response.ok) throw new Error(result.mensaje);

        const stats = result.estadisticas;
        document.getElementById('stats_playing').textContent = stats.jugando;
        document.getElementById('stats_completed').textContent = stats.completados;
        document.getElementById('stats_planned').textContent = stats.planeados;
        document.getElementById('stats_dropped').textContent = stats.abandonados;

        const rating = document.getElementById('stats_rating');
        if (stats.calificacionMedia === null) {
            rating.textContent = 'Sin calificaciones';
        } else {
            rating.innerHTML = `${stats.calificacionMedia}/10 <i class="bi bi-star-fill text-warning"></i> ` +
                `<span class="small">(${stats.totalCalificaciones} votos)</span>`;
        }
    } catch (err) {
        console.error('Error en estadísticas:', err);
        document.getElementById('stats_rating').textContent = 'No disponible';
    }
}

async function cargarDetalle() {
    if (!juegoId) {
        detailTitle.textContent = 'No se indicó ningún juego';
        return;
    }

    showLoading();
    try {
        const response = await fetch(`${API_URL}/games/${juegoId}`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.mensaje || 'No se pudo cargar el juego');
        }

        juegoActual = result.juego;
        mostrarJuego(juegoActual);
        cargarEstadisticas();
    } catch (err) {
        console.error('Error en detalle:', err);
        detailTitle.textContent = 'Juego no encontrado';
        alert('No se pudo cargar el juego: ' + err.message);
    } finally {
        hideLoading();
    }
}

if (detailTitle) cargarDetalle();