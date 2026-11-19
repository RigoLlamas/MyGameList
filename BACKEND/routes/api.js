const express = require('express');
const path = require('path');
const routerApi = express.Router();

routerApi.get('/', (req,res) => {
    if(req.header("x-auth")){
        res.sendFile(path.resolve(__dirname+"/../../FRONTEND/views/index.html"));
    }
    else{
        res.sendFile(path.resolve(__dirname+"/../../FRONTEND/views/login.html"));
    }
});
routerApi.get('/home.html', (req,res) => {
    res.sendFile(path.resolve(__dirname+"/../../FRONTEND/views/index.html"));
});
routerApi.get('/login.html', (req, res) => {
    res.sendFile(path.resolve(__dirname+"/../../FRONTEND/views/login.html"));
});

module.exports = routerApi;