// Configuración global del frontend. Se carga primero en todas las vistas.

// Con Live Server (puertos 5500/5501) el backend sigue en :3000; si el frontend
// lo sirve Express, se usa dinámicamente window.location.origin.
const ORIGIN = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '3000' && window.location.port !== ''
    ? 'http://localhost:3000'
    : window.location.origin;

const API_URL = `${ORIGIN}/api`;      // usado por auth_controller.js y demás
const VIEWS_URL = '/views/';          // las vistas siempre cuelgan de /views/

const PUBLIC_PAGES = ['', 'index.html', 'login.html', 'catalog.html', 'game-detail.html'];
const page = window.location.pathname.split('/').pop();

function showLoading() {
    const overlay = document.getElementById('loading_overlay');
    if (overlay) overlay.style.display = 'flex';
}
function hideLoading() {
    const overlay = document.getElementById('loading_overlay');
    if (overlay) overlay.style.display = 'none';
}

function validateLogin() {
    const logged = !!sessionStorage.getItem('user');

    if (!logged && !PUBLIC_PAGES.includes(page)) {
        alert('Favor de iniciar sesion');
        window.location.href = VIEWS_URL + 'login.html';
        return;
    }
    if (logged && page === 'login.html') {
        window.location.href = VIEWS_URL + 'index.html';
    }
}
validateLogin();