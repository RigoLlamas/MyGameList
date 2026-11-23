const express = require('express');
const routerUsers = express.Router();
const usersController = require('../controllers/users_api_controller.js');

// Búsqueda de usuarios por nombre: GET /api/users?search=texto&excluir=<idPropio>
routerUsers.get('/', usersController.searchUsers);

// Amigos (unidireccional, sin aprobación)
routerUsers.get('/:id/friends', usersController.getFriends);
routerUsers.post('/:id/friends/:amigoId', usersController.addFriend);
routerUsers.delete('/:id/friends/:amigoId', usersController.removeFriend);

// Perfil
routerUsers.get('/:id', usersController.getUserById);
routerUsers.put('/:id', usersController.updateUser);
routerUsers.delete('/:id', usersController.deleteUser);

module.exports = routerUsers;
