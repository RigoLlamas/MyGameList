const express = require('express');
const path = require('path');
const routerUsers = express.Router();
const usersController = require('../controllers/users_api_controller.js');

routerUsers.use('/:id', usersController.authUserMiddleware)

routerUsers.post('/', usersController.registerUser);
routerUsers.get('/', usersController.getUsers);
routerUsers.get('/:id', usersController.getUserById);
routerUsers.patch('/:id', usersController.patchUser);
routerUsers.delete('/:id', usersController.delete);

module.exports = routerUsers;