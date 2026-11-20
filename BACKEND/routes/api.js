const express = require('express');
const path = require('path');
const routerApi = express.Router();
const routerUsers = require('./users.js');
const usersController = require('../controllers/users_api_controller.js')

routerApi.use('/users', routerUsers);


routerApi.get('/', (req,res) => {
    res.redirect('/views/index.html');
});
routerApi.get('/home.html', (req,res) => {
    res.sendFile(path.resolve(__dirname+"/../../FRONTEND/views/index.html"));
});
routerApi.get('/login.html', (req, res) => {
    res.sendFile(path.resolve(__dirname+"/../../FRONTEND/views/login.html"));
});
routerApi.post('/login', usersController.login)


module.exports = routerApi;