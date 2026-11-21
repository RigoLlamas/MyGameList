const express = require('express');
const router = express.Router();
const {
  getPlatforms,
  getPlatformById,
  createPlatform,
  updatePlatform,
  deletePlatform
} = require('../controllers/platforms_api_controller');

router.get('/', getPlatforms);
router.get('/:id', getPlatformById);
router.post('/', createPlatform);
router.put('/:id', updatePlatform);
router.patch('/:id', updatePlatform);
router.delete('/:id', deletePlatform);

module.exports = router;
