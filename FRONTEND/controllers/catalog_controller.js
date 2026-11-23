// ==================== CATÁLOGO ====================
const catalogGrid = document.getElementById('catalog_grid');
const catalogSearch = document.getElementById('catalog_search');
const catalogGenre = document.getElementById('catalog_genre');
const catalogPlatform = document.getElementById('catalog_platform');
const catalogSort = document.getElementById('catalog_sort');
const catalogPagination = document.getElementById('catalog_pagination');

let pagina_actual = 1;

// Escapa texto antes de meterlo en innerHTML (los títulos vienen de Steam o de usuarios)
function escapeHTML(texto) {
    const div = document.createElement('div');
    div.textContent = texto ?? '';
    return div.innerHTML;
}

// Genera el HTML de UNA tarjeta a partir de un juego de la BD
function crearTarjeta(juego) {
    const imagen = juego.caratula
        ? `<img src="${escapeHTML(juego.caratula)}" class="card-img-top rounded-top-3" alt="${escapeHTML(juego.titulo)}" style="aspect-ratio: 4/5; object-fit: cover;">`
        : `<div class="img-placeholder text-secondary rounded-top-3"><i class="bi bi-image fs-1 opacity-50"></i></div>`;

    const generos = juego.generos.slice(0, 2).join(', ');          // máximo 2 para que no se desborde
    const plataformas = juego.plataformas
        .map(p => `<span class="badge text-bg-secondary px-2 py-1 rounded-pill small">${escapeHTML(p)}</span>`)
        .join('');

    return `
        <div class="col">
            <div class="card h-100 border-0 shadow-sm rounded-3">
                ${imagen}
                <div class="card-body d-flex flex-column p-3">
                    <h6 class="card-title fw-bold text-dark mb-1">${escapeHTML(juego.titulo)}</h6>
                    <p class="text-secondary small mb-2">${escapeHTML(juego.anioSalida)} &nbsp;|&nbsp; ${escapeHTML(generos)}</p>
                    <div class="d-flex flex-wrap gap-1 mb-3">${plataformas}</div>
                    <a href="game-detail.html?id=${juego._id}" class="btn btn-outline-primary btn-sm mt-auto w-100">Ver Detalle</a>
                </div>
            </div>
        </div>`;
}

// Dibuja los botones de paginación según lo que respondió el backend
function renderPaginacion(paginaActual, totalPaginas) {
    if (totalPaginas <= 1) {
        catalogPagination.innerHTML = '';        // con una sola página no hace falta
        return;
    }

    let html = `
        <li class="page-item ${paginaActual === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${paginaActual - 1}">Anterior</a>
        </li>`;

    for (let i = 1; i <= totalPaginas; i++) {
        html += `
            <li class="page-item ${i === paginaActual ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>`;
    }

    html += `
        <li class="page-item ${paginaActual === totalPaginas ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${paginaActual + 1}">Siguiente</a>
        </li>`;

    catalogPagination.innerHTML = html;
}

// Pide los juegos al backend y los pinta en la grilla
async function cargarCatalogo() {
    showLoading();
    try {
        const params = new URLSearchParams({
            search: catalogSearch.value.trim(),
            genre: catalogGenre.value,
            platform: catalogPlatform.value,
            sort: catalogSort.value,
            page: pagina_actual,
            limit: 8
        });
        const response = await fetch (`${API_URL}/games?${params}`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.mensaje || 'Error al cargar el catálogo');
        }

        if (result.juegos.length === 0) {
            catalogGrid.innerHTML = `<p class="text-secondary text-center w-100">No se encontraron juegos.</p>`;
            catalogPagination.innerHTML = '';
            return;
        }

        catalogGrid.innerHTML = result.juegos.map(crearTarjeta).join('');
        catalogGrid.innerHTML = result.juegos.map(crearTarjeta).join('');
        renderPaginacion(result.paginaActual, result.totalPaginas);
    } catch (err) {
        console.error('Error en catálogo:', err);
        alert('No se pudo cargar el catálogo: ' + err.message);
    } finally {
        hideLoading();
    }
}
//Cuando cambia un filtro, se regresa a la pagina 1 y se recarga
function aplicarFiltros(){
    pagina_actual = 1;
    cargarCatalogo()
}

// Busqueda: espera a que el usuario deje de escribir 400 ms antes de bussacar
let temporizador_busqueda;
if(catalogSearch){
    catalogSearch.addEventListener('input', ()=>{
        clearTimeout(temporizador_busqueda);
        temporizador_busqueda = setTimeout(aplicarFiltros, 400);
    });
}

// Selects: recargan en cuanto cambian
[catalogGenre, catalogPlatform, catalogSort].forEach(select => {
    if(select) select.addEventListener('change', aplicarFiltros);
});

// Paginación: un solo listener para todos los botones
if (catalogPagination) {
    catalogPagination.addEventListener('click', (event) => {
        const link = event.target.closest('a[data-page]');
        if (!link) return;

        event.preventDefault();                            // que el href="#" no salte arriba ni cambie la URL
        const item = link.parentElement;
        if (item.classList.contains('disabled') || item.classList.contains('active')) return;

        pagina_actual = Number(link.dataset.page);
        cargarCatalogo();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

if (catalogGrid) cargarCatalogo();