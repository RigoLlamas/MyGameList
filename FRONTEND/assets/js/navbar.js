function renderNavbar(){
    const links = [
        {nombre: 'Inicio', href: 'index.html'},
        {nombre: 'Catalogo', href: 'catalog.html'},
        {nombre: 'Mi Lista', href: 'my-list.html'},
    ]

    // Detecta la página actual para marcar el link como activo
    const paginaActual = location.pathname.split("/").pop() || "index.html";

    const items = links
    .map(
        (link) => `
        <li class="nav-item">
        <a class="nav-link ${link.href === paginaActual ? "active" : ""}"
            href="${link.href}">${link.nombre}</a>
        </li>`
    )
    .join("");

    const botonSesion = Auth.estaLogueado()
        ? `<a href="profile.html" class="btn btn-outline-light rounded-pill px-4">Mi Página</a>
           <button id="btnLogout" type="button" class="btn btn-danger rounded-pill px-4 ms-2" data-bs-toggle="modal" data-bs-target="#logout">Cerrar Sesión</button>`
        : `<a href="login.html" class="btn btn-outline-light rounded-pill px-4">Iniciar Sesión</a>`;

    return `
        <nav class="navbar navbar-expand-lg navbar-dark bg-navy py-3">
            <div class="container">
            <a class="navbar-brand d-flex align-items-center gap-2 fw-bold fs-4" href="index.html">
                <i class="bi bi-controller fs-3"></i> MyGameList
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav mx-auto mb-2 mb-lg-0">
                    ${items}
                </ul>
                <div>
                ${botonSesion}
                </div>
            </div>
            </div>

            <!--Logout Modal-->
            <div class="modal" id="logout">
                <div class="modal-dialog">
                    <div class="modal-content">

                    <!-- Modal Header -->
                    <div class="modal-header">
                        <h4 class="modal-title">Cerrar Sesion</h4>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>

                    <!-- Modal body -->
                    <div class="modal-body">
                        Seguro que desea cerrar sesion?
                    </div>

                    <!-- Modal footer -->
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary"  id="btnConfirmLogout">Aceptar</button>
                    </div>

                    </div>
                </div>
            </div>
        </nav>
    `
}
document.getElementById("navbar").innerHTML = renderNavbar();

// Cerrar sesión (el botón solo existe si hay usuario logueado)
const btnConfirmLogout = document.getElementById("btnConfirmLogout");
if (btnConfirmLogout) {
    btnConfirmLogout.addEventListener("click", () => {
        Auth.cerrarSesion();
        window.location.href = "index.html";
    });
}