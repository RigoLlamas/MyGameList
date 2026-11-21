// BACKEND/routes/games.js
const express = require('express');
const router = express.Router();
const { getGames, getGameById, createGame } = require('../controllers/games_api_controller');

router.get('/', getGames);
router.get('/:id', getGameById);
router.post('/', createGame);

module.exports = router;