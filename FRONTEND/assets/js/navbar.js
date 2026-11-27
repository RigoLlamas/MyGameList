function renderNavbar() {
    const base = typeof VIEWS_URL !== 'undefined' ? VIEWS_URL : '/views/';
    const links = [
        { nombre: 'Inicio', href: 'index.html' },
        { nombre: 'Catalogo', href: 'catalog.html' },
        { nombre: 'Mi Lista', href: 'my-list.html' },
    ]

    // Detecta la página actual para marcar el link como activo
    const paginaActual = location.pathname.split("/").pop() || "index.html";

    const items = links
        .map((link) => `
        <li class="nav-item">
            <a class="nav-link ${link.href === paginaActual ? 'active' : ''}"
               href="${base}${link.href}">${link.nombre}</a>
        </li>`)
        .join('');

    // Búsqueda de personas: solo con sesión (para agregar amigos hay que estar logueado)
    const buscador = sessionStorage.getItem('user')
        ? `
            <form id="navbar_search_form" class="d-flex me-lg-3 my-2 my-lg-0" role="search">
                <div class="input-group input-group-sm">
                    <span class="input-group-text bg-white border-end-0 rounded-start-pill text-secondary">
                        <i class="bi bi-search"></i>
                    </span>
                    <input id="navbar_search" type="search" class="form-control border-start-0 rounded-end-pill"
                           placeholder="Buscar personas..." aria-label="Buscar personas">
                </div>
            </form>
        `
        : '';

    // Foto de perfil del usuario en sesión, o el ícono si no tiene (o si la imagen no carga)
    const usuario = JSON.parse(sessionStorage.getItem('user') || 'null');
    const icono = `<i class="bi bi-person-circle fs-3 me-2 ${usuario?.fotoPerfil ? 'd-none' : ''}"></i>`;
    const avatar = usuario?.fotoPerfil
        ? `<img src="${ORIGIN + usuario.fotoPerfil}" alt="Foto de perfil" class="rounded-circle me-2"
                style="width: 36px; height: 36px; object-fit: cover;"
                onerror="this.classList.add('d-none'); this.nextElementSibling.classList.remove('d-none');">
           ${icono}`
        : icono;

    const botonSesion = usuario
        ? `
            <div class="dropdown">
                <a href="#" class="d-flex align-items-center text-white text-decoration-none dropdown-toggle active border-bottom border-primary border-2" id="dropdownUser" data-bs-toggle="dropdown" aria-expanded="false">
                    ${avatar}
                </a>
                <ul class="dropdown-menu dropdown-menu-end shadow" aria-labelledby="dropdownUser">
                    <li><a class="dropdown-item ${paginaActual === 'profile.html' ? 'active' : ''}" href="${base}profile.html">Ver Perfil</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="#" data-bs-toggle="modal" data-bs-target="#logout">Cerrar Sesión</a></li>
                </ul>
            </div>
        `
        : `<a href="${base}login.html" class="btn btn-outline-light rounded-pill px-4">Iniciar Sesión</a>`;

    return `
        <nav class="navbar navbar-expand-lg navbar-dark bg-navy py-3">
            <div class="container">
                <a class="navbar-brand d-flex align-items-center gap-2 fw-bold fs-4" href="${base}index.html">
                    <i class="bi bi-controller fs-3"></i> MyGameList
                </a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul class="navbar-nav mx-auto mb-2 mb-lg-0">
                        ${items}
                    </ul>
                    ${buscador}
                    ${botonSesion}
                </div>
            </div>
            <!-- Logout Modal -->
            <div class="modal" id="logout">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h4 class="modal-title">Cerrar Sesion</h4>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            Seguro que desea cerrar sesion?
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="btnConfirmLogout">Aceptar</button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    `;
}

const navbarContainer = document.getElementById('navbar');
if (navbarContainer) {
    navbarContainer.innerHTML = renderNavbar();

    // El botón de cerrar sesión solo existe si hay usuario logueado
    const btnConfirmLogout = document.getElementById('btnConfirmLogout');
    if (btnConfirmLogout) {
        btnConfirmLogout.addEventListener('click', () => {
            if (typeof logout === 'function') logout();
            else { sessionStorage.clear(); window.location.href = '/views/login.html'; }
        });
    }

    // Buscar personas: redirige a users.html?search=<texto>
    const formBusqueda = document.getElementById('navbar_search_form');
    const inputBusqueda = document.getElementById('navbar_search');
    if (formBusqueda && inputBusqueda) {
        // Si ya estamos en la página de resultados, mostrar lo que se buscó
        inputBusqueda.value = new URLSearchParams(window.location.search).get('search') || '';

        formBusqueda.addEventListener('submit', (event) => {
            event.preventDefault();
            const texto = inputBusqueda.value.trim();
            if (!texto) return;
            const base = typeof VIEWS_URL !== 'undefined' ? VIEWS_URL : '/views/';
            window.location.href = `${base}users.html?search=${encodeURIComponent(texto)}`;
        });
    }
}