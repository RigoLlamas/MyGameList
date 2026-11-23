// BACKEND/routes/games.js
const express = require('express');
const router = express.Router();
const {
  getGames,
  getGameById,
  createGame,
  syncSteamCatalog
} = require('../controllers/games_api_controller');

// Rutas de sincronización (deben ir antes de /:id para no chocar con el parámetro)
router.get('/sync-steam', syncSteamCatalog);
router.post('/sync-steam', syncSteamCatalog);

router.get('/', getGames);
router.get('/:id', getGameById);
router.post('/', createGame);

module.exports = router;
