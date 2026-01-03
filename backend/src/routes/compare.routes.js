const express = require('express');
const router = express.Router();
const compareController = require('../controllers/compare.controller');
const { compareValidation } = require('../middleware/validation');
const { rateLimiters } = require('../middleware/rateLimit');

router.post('/', rateLimiters.compare, compareValidation.compare, compareController.compare);
router.post('/preview', compareValidation.compare, compareController.getItemsForComparison);

module.exports = router;