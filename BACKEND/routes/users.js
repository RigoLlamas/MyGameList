const express = require('express');
const routerUsers = express.Router();
const usersController = require('../controllers/users_api_controller.js');

routerUsers.get('/:id', usersController.getUserById);
routerUsers.put('/:id', usersController.updateUser);
routerUsers.delete('/:id', usersController.deleteUser);

module.exports = routerUsers;