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
    const formData = new FormData(event.target);            // se envía tal cual (incluye la foto)
    const data = Object.fromEntries(formData.entries());    // solo para validar

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
    // data.fotoPerfil es un File (size 0 si no eligió imagen; la foto es opcional)
    if (data.fotoPerfil && data.fotoPerfil.size > 1024 * 1024) {
        alert('La imagen no puede pesar más de 1 MB.');
        return;
    }

    mostrarCarga('Creando cuenta...');
    try {
        const response = await fetch(`${BASE_API}/auth/register`, {
            method: 'POST',
            // Sin 'Content-Type': el navegador lo pone solo (multipart/form-data)
            body: formData
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
    const inputFecha = document.getElementById('inputBirthdate');

    if (inputNombre) inputNombre.value = usuario.nombre || '';
    // Cada vez que se abre el modal, la foto empieza sin archivo y sin "Quitar foto"
    document.getElementById('inputAvatar').value = '';
    document.getElementById('inputQuitarFoto').checked = false;
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
    // FormData incluye la imagen del <input type="file">; multer la recibe en el backend
    const data = new FormData(event.target);
    const foto = data.get('fotoPerfil');      // objeto File (size 0 si no eligió nada)

    if (data.get('quitarFoto')) {
        data.delete('fotoPerfil');            // quitar tiene prioridad sobre subir
    } else if (foto && foto.size > 1024 * 1024) {
        alert('La imagen no puede pesar más de 1 MB.');
        return;
    }

    mostrarCarga('Guardando cambios...');
    try {
        const response = await fetch(`${BASE_API}/users/${usuario._id}`, {
            method: 'PUT',
            // Sin 'Content-Type': el navegador lo pone solo (multipart/form-data)
            headers: { 'x-user-id': usuario._id },
            body: data
        });

        if (!response.ok) {
            throw new Error(await obtenerMensajeError(response));
        }

        const result = await response.json();
        sessionStorage.setItem('user', JSON.stringify(result.usuario));

        bootstrap.Modal.getInstance(modalEdit)?.hide();
        alert('Perfil actualizado correctamente.');
        window.location.reload();   // recarga para que el perfil y la navbar muestren los datos nuevos
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
                avatarEl.src = ORIGIN + usuario.fotoPerfil;   // la BD guarda '/uploads/...', falta el servidor
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