// ==================== AMIGOS Y BÚSQUEDA DE USUARIOS ====================
// Se usa en dos páginas:
//   - users.html   → resultados de la búsqueda de la navbar (agregar / eliminar amigo)
//   - profile.html → lista de amigos del usuario (eliminar amigo)
// Cada parte solo se ejecuta si su contenedor existe en la página.

const usersResults = document.getElementById('users_results');   // users.html
const friendsList = document.getElementById('friends_list');     // profile.html

// Usuario con sesión iniciada (users.html es privada; profile.html también)
const usuarioSesion = sessionStorage.getItem('user') ? JSON.parse(sessionStorage.getItem('user')) : null;

let idsAmigos = new Set();     // _id de mis amigos, para saber qué botón mostrar
let resultadosBusqueda = [];   // últimos resultados, para volver a pintarlos sin pedirlos otra vez

// Escapa texto antes de meterlo en innerHTML (los nombres los escriben los usuarios).
// También escapa comillas, porque algunos valores van dentro de atributos (src="...", data-nombre="...")
function escaparHTML(texto) {
    return String(texto ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// fetch + JSON + manejo de errores del backend ({ ok, mensaje })
async function pedirAPI(ruta, metodo = 'GET') {
    const response = await fetch(`${API_URL}${ruta}`, { method: metodo });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.mensaje || `Error HTTP ${response.status}`);
    }
    return result;
}

// Foto circular del usuario; si no tiene foto o la imagen no carga, muestra el ícono
function avatarHTML(usuario) {
    const icono = `
        <div class="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center flex-shrink-0 ${usuario.fotoPerfil ? 'd-none' : ''}"
             style="width: 48px; height: 48px;">
            <i class="bi bi-person-fill fs-4"></i>
        </div>`;

    if (!usuario.fotoPerfil) return icono;

    return `
        <img src="${ORIGIN + escaparHTML(usuario.fotoPerfil)}" alt="" class="rounded-circle flex-shrink-0"
             style="width: 48px; height: 48px; object-fit: cover;"
             onerror="this.classList.add('d-none'); this.nextElementSibling.classList.remove('d-none');">
        ${icono}`;
}

// Tarjeta de un usuario con su botón (Agregar o Eliminar)
function tarjetaUsuario(usuario) {
    const esAmigo = idsAmigos.has(usuario._id);
    const boton = esAmigo
        ? `<button type="button" class="btn btn-outline-danger btn-sm rounded-pill"
                   data-accion="eliminar" data-amigo-id="${usuario._id}" data-nombre="${escaparHTML(usuario.nombre)}">
               <i class="bi bi-person-x me-1"></i>Eliminar amigo
           </button>`
        : `<button type="button" class="btn btn-primary btn-sm rounded-pill"
                   data-accion="agregar" data-amigo-id="${usuario._id}" data-nombre="${escaparHTML(usuario.nombre)}">
               <i class="bi bi-person-plus me-1"></i>Agregar amigo
           </button>`;

    return `
        <div class="col">
            <div class="card border rounded-3 p-3 h-100 shadow-sm">
                <div class="d-flex align-items-center gap-3">
                    ${avatarHTML(usuario)}
                    <div class="flex-grow-1 text-truncate">
                        <h6 class="fw-bold mb-0 text-truncate">${escaparHTML(usuario.nombre)}</h6>
                    </div>
                </div>
                <div class="mt-3 pt-2 border-top">${boton}</div>
            </div>
        </div>`;
}

// ==================== MIS AMIGOS ====================
async function cargarAmigos() {
    const result = await pedirAPI(`/users/${usuarioSesion._id}/friends`);
    idsAmigos = new Set(result.amigos.map(a => a._id));
    return result.amigos;
}

// profile.html: pinta la lista de amigos y el contador
function pintarAmigos(amigos) {
    const contador = document.getElementById('friends_count');
    if (contador) contador.textContent = amigos.length;

    friendsList.innerHTML = amigos.length === 0
        ? `<p class="text-secondary mb-0">Aún no tienes amigos. Usa la barra <strong>Buscar personas</strong> de arriba para encontrar jugadores.</p>`
        : amigos.map(tarjetaUsuario).join('');
}

// ==================== RESULTADOS DE BÚSQUEDA (users.html) ====================
function pintarResultados() {
    usersResults.innerHTML = resultadosBusqueda.length === 0
        ? `<p class="text-secondary mb-0">No se encontraron usuarios con ese nombre.</p>`
        : resultadosBusqueda.map(tarjetaUsuario).join('');
}

async function cargarResultados() {
    const search = (new URLSearchParams(window.location.search).get('search') || '').trim();
    const titulo = document.getElementById('users_title');

    if (!search) {
        if (titulo) titulo.textContent = 'Buscar personas';
        usersResults.innerHTML = `<p class="text-secondary mb-0">Escribe un nombre en la barra de búsqueda de arriba.</p>`;
        return;
    }
    if (titulo) titulo.textContent = `Resultados para "${search}"`;

    showLoading();
    try {
        // Primero mis amigos (para saber qué botón va en cada resultado), luego la búsqueda
        await cargarAmigos();
        const params = new URLSearchParams({ search, excluir: usuarioSesion._id });
        const result = await pedirAPI(`/users?${params}`);
        resultadosBusqueda = result.usuarios;
        pintarResultados();
    } catch (err) {
        console.error('Error buscando usuarios:', err);
        usersResults.innerHTML = '';
        alert('No se pudo realizar la búsqueda: ' + err.message);
    } finally {
        hideLoading();
    }
}

// ==================== AGREGAR / ELIMINAR AMIGO ====================
async function cambiarAmistad(accion, amigoId, nombre) {
    if (accion === 'eliminar' && !confirm(`¿Eliminar a ${nombre} de tus amigos?`)) return;

    showLoading();
    try {
        const metodo = accion === 'agregar' ? 'POST' : 'DELETE';
        const result = await pedirAPI(`/users/${usuarioSesion._id}/friends/${amigoId}`, metodo);

        // El backend devuelve la lista de amigos actualizada: se repinta sin recargar
        idsAmigos = new Set(result.amigos.map(a => a._id));
        if (usersResults) pintarResultados();
        if (friendsList) pintarAmigos(result.amigos);

        alert(result.mensaje);
    } catch (err) {
        console.error('Error actualizando amigos:', err);
        alert('No se pudo completar la acción: ' + err.message);
    } finally {
        hideLoading();
    }
}

// Un solo listener por contenedor para todos los botones (delegación de eventos)
function escucharBotones(contenedor) {
    contenedor.addEventListener('click', (event) => {
        const boton = event.target.closest('[data-accion]');
        if (!boton) return;
        cambiarAmistad(boton.dataset.accion, boton.dataset.amigoId, boton.dataset.nombre);
    });
}

// ==================== INICIO ====================
if (usuarioSesion) {
    if (usersResults) {
        escucharBotones(usersResults);
        cargarResultados();
    }

    if (friendsList) {
        escucharBotones(friendsList);
        cargarAmigos()
            .then(pintarAmigos)
            .catch(err => {
                console.error('Error cargando amigos:', err);
                friendsList.innerHTML = `<p class="text-danger mb-0">No se pudo cargar tu lista de amigos.</p>`;
            });
    }
}
