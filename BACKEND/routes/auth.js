// BACKEND/routes/auth.js
const express = require('express');
const routerAuth = express.Router();
const authController = require('../controllers/auth_api_controller');

// Rutas de autenticación
routerAuth.post('/login', authController.login);
routerAuth.post('/logout', authController.logout);
routerAuth.get('/me', authController.getMe);

module.exports = routerAuth;
