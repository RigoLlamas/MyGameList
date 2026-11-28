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

async function cargarPerfil() {
    const usuarioLogueado = obtenerUsuarioActual();
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get('id');

    // Determinar si se está viendo el perfil propio o el de otro usuario
    const esPerfilPropio = !idParam || (usuarioLogueado && (idParam === usuarioLogueado._id || idParam === usuarioLogueado.id));
    const targetUserId = esPerfilPropio ? (usuarioLogueado?._id || usuarioLogueado?.id) : idParam;

    if (!targetUserId) {
        alert('Usuario no especificado.');
        window.location.href = 'index.html';
        return;
    }

    // Elementos del DOM
    const nameEl = document.getElementById('user_name');
    const joinedEl = document.getElementById('user_joined_at');
    const bdayEl = document.getElementById('user_birthday');
    const bdayContainer = bdayEl ? bdayEl.parentElement : null;
    const avatarEl = document.getElementById('user_avatar');
    const placeholderEl = document.getElementById('user_avatar_placeholder');
    const editContainer = document.getElementById('container_edit_profile');
    const friendActionContainer = document.getElementById('container_friend_action');
    const manageFavsBtn = document.getElementById('btn_manage_favorites');
    const friendsSection = document.getElementById('section_friends');

    // 1. Configurar visibilidad según sea perfil propio o de un amigo/tercero
    if (!esPerfilPropio) {
        // Modo solo lectura: ocultar botón de edición y botón de gestionar favoritos
        if (editContainer) editContainer.classList.add('d-none');
        if (manageFavsBtn) manageFavsBtn.classList.add('d-none');
        // Ocultar la sección de administrar amigos propios cuando vemos el perfil ajeno
        if (friendsSection) friendsSection.classList.add('d-none');
    } else {
        if (editContainer) editContainer.classList.remove('d-none');
        if (friendActionContainer) friendActionContainer.classList.add('d-none');
        if (manageFavsBtn) manageFavsBtn.classList.remove('d-none');
        if (friendsSection) friendsSection.classList.remove('d-none');
    }

    // 2. Cargar datos del usuario desde la API (GET /api/users/:id)
    try {
        const resUser = await fetch(`${API_URL}/users/${encodeURIComponent(targetUserId)}`);
        const dataUser = await resUser.json();

        if (!resUser.ok || !dataUser.ok || !dataUser.usuario) {
            throw new Error(dataUser.mensaje || 'No se pudo obtener el usuario.');
        }

        const usuario = dataUser.usuario;

        document.title = `${usuario.nombre} - Perfil | MyGameList`;
        if (nameEl) nameEl.textContent = usuario.nombre;

        if (joinedEl && usuario.createdAt) {
            joinedEl.textContent = new Date(usuario.createdAt).toLocaleDateString('es-MX', {
                month: 'short',
                year: 'numeric'
            });
        }

        if (bdayEl) {
            if (esPerfilPropio && usuario.fechaNacimiento) {
                bdayEl.textContent = new Date(usuario.fechaNacimiento).toLocaleDateString('es-MX', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    timeZone: 'UTC'
                });
                if (bdayContainer) bdayContainer.classList.remove('d-none');
            } else if (!esPerfilPropio) {
                // Privacidad: nunca mostrar la fecha de nacimiento de otros usuarios
                if (bdayContainer) bdayContainer.classList.add('d-none');
            }
        }

        // Avatar
        if (avatarEl) {
            const mostrarPlaceholder = () => {
                avatarEl.classList.add('d-none');
                placeholderEl?.classList.remove('d-none');
            };

            if (usuario.fotoPerfil) {
                avatarEl.onerror = mostrarPlaceholder;
                avatarEl.src = ORIGIN + usuario.fotoPerfil;
                avatarEl.classList.remove('d-none');
                placeholderEl?.classList.add('d-none');
            } else {
                mostrarPlaceholder();
            }
        }

        // 3. Si no es mi perfil propio, mostrar botón para agregar o eliminar amigo
        if (!esPerfilPropio && usuarioLogueado && friendActionContainer) {
            await configurarBotonAmigo(targetUserId, usuario.nombre, friendActionContainer, usuarioLogueado);
        }
    } catch (err) {
        console.error('Error al cargar datos del usuario:', err);
        alert(err.message);
        return;
    }

    // 4. Cargar estadísticas y juegos favoritos del usuario consultado (GET /api/mylist?usuarioId=...)
    await cargarEstadisticasYFavoritos(targetUserId, esPerfilPropio);
}

// Configura el botón Agregar / Eliminar amigo en la vista del perfil ajeno
async function configurarBotonAmigo(amigoId, nombreAmigo, contenedor, usuarioLogueado) {
    try {
        const myId = usuarioLogueado._id || usuarioLogueado.id;
        const resFriends = await fetch(`${API_URL}/users/${encodeURIComponent(myId)}/friends`);
        const dataFriends = await resFriends.json();

        let esAmigo = false;
        if (resFriends.ok && dataFriends.ok && Array.isArray(dataFriends.amigos)) {
            esAmigo = dataFriends.amigos.some(a => String(a._id) === String(amigoId));
        }

        renderizarBotonAmistad(contenedor, esAmigo, amigoId, nombreAmigo, myId);
    } catch (err) {
        console.error('Error al verificar amistad:', err);
    }
}

function renderizarBotonAmistad(contenedor, esAmigo, amigoId, nombreAmigo, myId) {
    contenedor.classList.remove('d-none');
    contenedor.innerHTML = esAmigo
        ? `<button type="button" class="btn btn-outline-danger rounded-pill px-3 d-inline-flex align-items-center gap-2" id="btn_friend_toggle">
               <i class="bi bi-person-x"></i> Eliminar amigo
           </button>`
        : `<button type="button" class="btn btn-primary rounded-pill px-3 d-inline-flex align-items-center gap-2" id="btn_friend_toggle">
               <i class="bi bi-person-plus"></i> Agregar amigo
           </button>`;

    const btn = document.getElementById('btn_friend_toggle');
    if (btn) {
        btn.addEventListener('click', async () => {
            if (esAmigo && !confirm(`¿Deseas eliminar a ${nombreAmigo} de tus amigos?`)) return;

            if (typeof showLoading === 'function') showLoading();
            try {
                const metodo = esAmigo ? 'DELETE' : 'POST';
                const response = await fetch(`${API_URL}/users/${encodeURIComponent(myId)}/friends/${encodeURIComponent(amigoId)}`, {
                    method: metodo
                });
                const result = await response.json();

                if (!response.ok || !result.ok) {
                    throw new Error(result.mensaje || 'Error al actualizar amistad.');
                }

                alert(result.mensaje);
                // Invertir estado del botón
                renderizarBotonAmistad(contenedor, !esAmigo, amigoId, nombreAmigo, myId);
            } catch (err) {
                console.error('Error en amistad:', err);
                alert(err.message);
            } finally {
                if (typeof hideLoading === 'function') hideLoading();
            }
        });
    }
}

async function cargarEstadisticasYFavoritos(targetUserId, esPerfilPropio) {
    const statGames = document.getElementById('stat_total_games');
    const statCompleted = document.getElementById('stat_completed_games');
    const statHours = document.getElementById('stat_total_hours');
    const favCount = document.getElementById('favorites_count');
    const favGrid = document.getElementById('favorites_grid');

    try {
        const response = await fetch(`${API_URL}/mylist?usuarioId=${encodeURIComponent(targetUserId)}`);
        const data = await response.json();

        if (!response.ok || !data.ok || !Array.isArray(data.juegos)) {
            throw new Error(data.mensaje || 'No se pudieron cargar los datos de la lista.');
        }

        const juegos = data.juegos;
        const contadores = data.contadores || {};

        // Estadísticas
        const totalJuegos = juegos.length;
        const completados = contadores.completed ?? juegos.filter(j => j.estado === 'completed').length;
        const totalHoras = juegos.reduce((acum, j) => acum + (Number(j.horasJugadas) || 0), 0);

        if (statGames) statGames.textContent = totalJuegos;
        if (statCompleted) statCompleted.textContent = completados;
        if (statHours) statHours.textContent = `${totalHoras} h`;

        // Favoritos
        const favoritos = juegos.filter(j => Boolean(j.esFavorito));
        if (favCount) favCount.textContent = favoritos.length;

        if (favGrid) {
            if (favoritos.length === 0) {
                favGrid.innerHTML = `
                    <div class="col-12 text-center py-4 text-secondary">
                        <i class="bi bi-heart fs-2 opacity-50 d-block mb-2"></i>
                        <p class="mb-1 fw-semibold">${esPerfilPropio ? 'Aún no has marcado videojuegos como favoritos.' : 'Este usuario aún no tiene videojuegos favoritos.'}</p>
                        ${esPerfilPropio ? '<small>Ve a <a href="my-list.html" class="text-decoration-none">Mi Lista</a> o al <a href="catalog.html" class="text-decoration-none">Catálogo</a> y márcalos con el ícono de corazón.</small>' : ''}
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
        console.error('Error al cargar estadísticas y favoritos:', err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    cargarPerfil();
});
