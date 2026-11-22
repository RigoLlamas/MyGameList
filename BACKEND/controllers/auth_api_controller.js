// BACKEND/controllers/auth_api_controller.js
const { User, UserException, users } = require('../models/user.js');

// POST /api/auth/login
const login = (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Correo y contraseña son requeridos.'
      });
    }

    const usuario = users.find(u => u.email === email && u.password === password);

    if (!usuario) {
      return res.status(401).json({
        ok: false,
        mensaje: 'Credenciales inválidas. Revisa tu correo o contraseña.'
      });
    }

    // Responder con datos del usuario
    res.json(usuario);
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error durante el inicio de sesión',
      error: error.message
    });
  }
};

// POST /api/auth/logout
const logout = (req, res) => {
  res.json({
    ok: true,
    mensaje: 'Sesión cerrada exitosamente.'
  });
};

// GET /api/auth/me (Verifica el usuario actual mediante el encabezado x-auth)
const getMe = (req, res) => {
  const authHeader = req.header('x-auth');
  const userId = req.header('x-user-id');

  if (!authHeader) {
    return res.status(401).json({ ok: false, mensaje: 'No autorizado. Falta cabecera de autenticación.' });
  }

  const usuario = users.find(u => (userId ? u.id === Number(userId) : true) && u.password === authHeader);

  if (!usuario) {
    return res.status(401).json({ ok: false, mensaje: 'Token o sesión no válida.' });
  }

  res.json({ ok: true, usuario });
};

module.exports = {
  login,
  logout,
  getMe
};
