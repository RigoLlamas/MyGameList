// BACKEND/routes/auth.js
const express = require('express');
const routerAuth = express.Router();
const authController = require('../controllers/auth_api_controller');

// Rutas de autenticación
routerAuth.post('/register', authController.registerUser);
routerAuth.post('/login', authController.loginUser);

module.exports = routerAuth;
