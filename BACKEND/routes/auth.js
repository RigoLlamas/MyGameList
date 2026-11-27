// BACKEND/routes/auth.js
const express = require('express');
const routerAuth = express.Router();
const authController = require('../controllers/auth_api_controller');
const { subirFoto } = require('../middleware/subir_foto');

// Rutas de autenticación
routerAuth.post('/register', subirFoto, authController.registerUser);   // foto de perfil opcional
routerAuth.post('/login', authController.loginUser);

module.exports = routerAuth;
