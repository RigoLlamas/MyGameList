const express = require('express');
const router = express.Router();
const {
  getMyList,
  getMyListGameById,
  addGameToMyList,
  updateMyListGame,
  toggleFavorite,
  deleteGameFromMyList
} = require('../controllers/mylist_api_controller');

// Rutas de la lista personal
router.get('/', getMyList);
router.get('/:id', getMyListGameById);
router.post('/', addGameToMyList);
router.put('/:id', updateMyListGame);
router.patch('/:id', updateMyListGame);
router.patch('/:id/favorite', toggleFavorite);
router.delete('/:id', deleteGameFromMyList);

module.exports = router;
