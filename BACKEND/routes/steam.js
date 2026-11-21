const express = require('express');
const router = express.Router();
const {
  searchSteamGames,
  getSteamGameDetail,
  getPopularSteamGames,
  getUserOwnedGames
} = require('../controllers/steam_api_controller');

router.get('/search', searchSteamGames);
router.get('/popular', getPopularSteamGames);
router.get('/game/:appid', getSteamGameDetail);
router.get('/owned/:steamId', getUserOwnedGames);

module.exports = router;