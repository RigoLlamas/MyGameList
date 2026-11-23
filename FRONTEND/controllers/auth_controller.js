const BASE_API = typeof API_URL !== 'undefined' ? API_URL : 'http://localhost:3000/api';
const REDIRECT_BASE = typeof VIEWS_URL !== 'undefined' ? VIEWS_URL : '/views/';

// Delega al loader global de env.js si está cargado, o usa el overlay local sin retraso fijo
function mostrarCarga(mensaje = 'Procesando...') {
    if (typeof showLoading === 'function') {
        showLoading(mensaje);
        return;
    }
    const overlay = document.getElementById('loading_overlay');
    if (overlay) overlay.style.display = 'flex';
}

function ocultarCarga() {
    if (typeof hideLoading === 'function') {
        hideLoading();
        return;
    }
    const overlay = document.getElementById('loading_overlay');
    if (overlay) overlay.style.display = 'none';
}

// Extrae el mensaje de error devuelto por el backend en JSON
async function obtenerMensajeError(response) {
    const texto = await response.text();
    try {
        const json = JSON.parse(texto);
        return json.mensaje || json.error || texto;
    } catch {
        return texto || `Error HTTP ${response.status}`;
    }
}

// ==================== INICIO DE SESIÓN ====================
async function login(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target).entries());

    mostrarCarga('Iniciando sesión...');
    try {
        const response = await fetch(`${BASE_API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(await obtenerMensajeError(response));
        }

        const result = await response.json();
        sessionStorage.setItem('user', JSON.stringify(result.usuario));
        window.location.href = REDIRECT_BASE + 'index.html';
    } catch (err) {
        console.error('Error en Login:', err);
        alert('Error iniciando sesión: ' + err.message);
    } finally {
        ocultarCarga();
    }
}

const formLogin = document.getElementById('formLogin');
if (formLogin) formLogin.addEventListener('submit', login);

// ==================== CERRAR SESIÓN ====================
function logout() {
    sessionStorage.clear();
    window.location.href = REDIRECT_BASE + 'login.html';
}

// ==================== REGISTRO DE USUARIO ====================
async function register(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target).entries());

    // Validaciones acordes al esquema de Mongoose
    if (!data.nombre || !data.nombre.trim()) {
        alert('El nombre de usuario es obligatorio.');
        return;
    }
    if (!data.password || data.password.length < 8) {
        alert('La contraseña debe tener al menos 8 caracteres.');
        return;
    }
    if (data.confirm_password && data.password !== data.confirm_password) {
        alert('Las contraseñas no coinciden.');
        return;
    }
    if (!data.fechaNacimiento || new Date(data.fechaNacimiento) > new Date()) {
        alert('Ingresa una fecha de nacimiento válida y no futura.');
        return;
    }

    // Si fotoPerfil viene como objeto File vacío desde un <input type="file">, se limpia para que Mongoose aplique default: ''
    if (data.fotoPerfil && typeof data.fotoPerfil !== 'string') {
        delete data.fotoPerfil;
    }

    mostrarCarga('Creando cuenta...');
    try {
        const response = await fetch(`${BASE_API}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(await obtenerMensajeError(response));
        }

        const result = await response.json();
        sessionStorage.setItem('user', JSON.stringify(result.usuario));
        window.location.href = REDIRECT_BASE + 'index.html';
    } catch (err) {
        console.error('Error en Registro:', err);
        alert('Error creando cuenta: ' + err.message);
    } finally {
        ocultarCarga();
    }
}

const formRegister = document.getElementById('formRegister');
if (formRegister) formRegister.addEventListener('submit', register);

// ==================== EDITAR Y ELIMINAR PERFIL ====================
function populateModal() {
    if (!sessionStorage.user) return;
    const usuario = JSON.parse(sessionStorage.user);

    const inputNombre = document.getElementById('inputUsername');
    const inputFoto = document.getElementById('inputAvatar');
    const inputFecha = document.getElementById('inputBirthdate');

    if (inputNombre) inputNombre.value = usuario.nombre || '';
    if (inputFoto && inputFoto.type !== 'file') inputFoto.value = usuario.fotoPerfil || '';
    if (inputFecha && usuario.fechaNacimiento) {
        inputFecha.value = usuario.fechaNacimiento.slice(0, 10);
    }
}

const modalEdit = document.getElementById('modalEditarPerfil');
if (modalEdit) {
    modalEdit.addEventListener('shown.bs.modal', populateModal);

    document.getElementById('btnOpenDelete')?.addEventListener('click', () => {
        bootstrap.Modal.getInstance(modalEdit)?.hide();
        new bootstrap.Modal(document.getElementById('modal_delete_user')).show();
    });
}

async function updateUser(event) {
    event.preventDefault();
    if (!sessionStorage.user) return;

    const usuario = JSON.parse(sessionStorage.user);
    const data = Object.fromEntries(new FormData(event.target).entries());

    if (data.fotoPerfil && typeof data.fotoPerfil !== 'string') {
        delete data.fotoPerfil;
    }

    mostrarCarga('Guardando cambios...');
    try {
        const response = await fetch(`${BASE_API}/users/${usuario._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': usuario._id
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(await obtenerMensajeError(response));
        }

        const result = await response.json();
        sessionStorage.setItem('user', JSON.stringify(result.usuario));

        bootstrap.Modal.getInstance(modalEdit)?.hide();
        init();
        alert('Perfil actualizado correctamente.');
    } catch (err) {
        console.error('Error en la edición:', err);
        alert('No se pudo actualizar: ' + err.message);
    } finally {
        ocultarCarga();
    }
}

const formEditProfile = document.getElementById('formEditProfile');
if (formEditProfile) formEditProfile.addEventListener('submit', updateUser);

async function deleteUser(event) {
    event.preventDefault();
    if (!sessionStorage.user) return;

    const usuario = JSON.parse(sessionStorage.user);

    mostrarCarga('Eliminando cuenta...');
    try {
        const response = await fetch(`${BASE_API}/users/${usuario._id}`, {
            method: 'DELETE',
            headers: { 'x-user-id': usuario._id }
        });

        if (!response.ok) {
            throw new Error(await obtenerMensajeError(response));
        }

        alert('Cuenta eliminada exitosamente.');
        sessionStorage.clear();
        window.location.href = REDIRECT_BASE + 'index.html';
    } catch (err) {
        console.error('Error en la eliminación:', err);
        alert('No se pudo eliminar: ' + err.message);
    } finally {
        ocultarCarga();
    }
}

const buttonConfirmDelete = document.getElementById('button_confirm_delete');
if (buttonConfirmDelete) buttonConfirmDelete.addEventListener('click', deleteUser);

// ==================== RENDERIZADO INICIAL DE VISTAS ====================
function init() {
    if (!sessionStorage.user) return;
    const usuario = JSON.parse(sessionStorage.user);
    const vistaActual = typeof page !== 'undefined' ? page : window.location.pathname.split('/').pop();

    if (vistaActual === 'profile.html') {
        const nameEl = document.getElementById('user_name');
        const joinedEl = document.getElementById('user_joined_at');
        const bdayEl = document.getElementById('user_birthday');
        const avatarEl = document.getElementById('user_avatar');

        if (nameEl) nameEl.textContent = usuario.nombre;

        if (joinedEl && usuario.createdAt) {
            joinedEl.textContent = new Date(usuario.createdAt).toLocaleDateString('es-MX', {
                month: 'short',
                year: 'numeric'
            });
        }

        if (bdayEl && usuario.fechaNacimiento) {
            bdayEl.textContent = new Date(usuario.fechaNacimiento).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                timeZone: 'UTC'
            });
        }

        const placeholderEl = document.getElementById('user_avatar_placeholder');
        if (avatarEl) {
            const mostrarPlaceholder = () => {
                avatarEl.classList.add('d-none');
                placeholderEl?.classList.remove('d-none');
            };

            if (usuario.fotoPerfil) {
                avatarEl.onerror = mostrarPlaceholder;      // si el link está roto, regresa el ícono
                avatarEl.src = usuario.fotoPerfil;
                avatarEl.classList.remove('d-none');
                placeholderEl?.classList.add('d-none');
            } else {
                mostrarPlaceholder();
            }
        }
    }

    if (vistaActual === 'index.html' || vistaActual === '') {
        document.getElementById('hero_welcome_message')?.classList.remove('d-none');
        document.getElementById('hero_login')?.classList.add('d-none');
        document.getElementById('hero_register')?.classList.add('d-none');
    }
}

document.addEventListener('DOMContentLoaded', init);