const express = require('express');
const mongoose = require('mongoose');
const routerApi = express.Router();

const routerGames = require('./games');
const routerSteam = require('./steam');
const routerUsers = require('./users');
const routerGenres = require('./genres');
const routerPlatforms = require('./platforms');
const routerMylist = require('./mylist');
const routerAuth = require('./auth');
const Game = require('../models/game');

routerApi.get('/test-db', async (req, res) => {
    try {
        const state = mongoose.connection.readyState;
        const estados = {
            0: 'Desconectado',
            1: 'Conectado',
            2: 'Conectando',
            3: 'Desconectando'
        };

        const isConnected = (state === 1);
        let detalles = {
            estado: estados[state] || 'Desconocido',
            codigoEstado: state,
            conectado: isConnected
        };

        if (isConnected) {
            const adminDb = mongoose.connection.db.admin();
            const pingResult = await adminDb.ping();
            const totalJuegos = await Game.countDocuments();

            detalles = {
                ...detalles,
                baseDeDatos: mongoose.connection.name,
                host: mongoose.connection.host,
                puerto: mongoose.connection.port,
                pingOk: (pingResult.ok === 1),
                colecciones: {
                    juegosRegistrados: totalJuegos
                }
            };
        }

        res.status(isConnected ? 200 : 503).json({
            ok: isConnected,
            mensaje: isConnected 
                ? 'Conexión a MongoDB Atlas verificada y funcional.' 
                : 'No hay conexión activa con MongoDB Atlas.',
            detalles,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: 'Error al consultar el estado de la base de datos',
            error: error.message
        });
    }
});

// Enrutadores funcionales
routerApi.use('/games', routerGames);
routerApi.use('/steam', routerSteam);
routerApi.use('/users', routerUsers);
routerApi.use('/genres', routerGenres);
routerApi.use('/platforms', routerPlatforms);
routerApi.use('/mylist', routerMylist);
routerApi.use('/auth', routerAuth);

module.exports = routerApi;
