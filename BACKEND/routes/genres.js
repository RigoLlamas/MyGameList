const express = require('express');
const router = express.Router();
const {
  getGenres,
  getGenreById,
  createGenre,
  updateGenre,
  deleteGenre
} = require('../controllers/genres_api_controller');

router.get('/', getGenres);
router.get('/:id', getGenreById);
router.post('/', createGenre);
router.put('/:id', updateGenre);
router.patch('/:id', updateGenre);
router.delete('/:id', deleteGenre);

module.exports = router;
