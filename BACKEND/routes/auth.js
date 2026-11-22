const express = require('express');
const routerAuth = express.Router();
const usersController = require('../controllers/users_api_controller.js');

routerAuth.post('/login', usersController.login);

module.exports = routerAuth;