const express = require('express');
const router = express.Router();
const itemController = require('../controllers/item.controller');
const { itemValidation } = require('../middleware/validation');
const { upload, checkFileUploaded } = require('../middleware/upload');
const { rateLimiters } = require('../middleware/rateLimit');

router.post(
  '/',
  rateLimiters.upload,
  upload.single('image'),
  (req, res, next) => {
    console.log("DEBUG BODY:", req.body);
    console.log("DEBUG FILE:", !!req.file);
    next();
  },
  checkFileUploaded,
  itemValidation.createItem,
  itemController.createItem
);


router.get(
  '/:itemId',
  rateLimiters.api,
  itemValidation.getItem,
  itemController.getItem
);

router.get(
  '/session/:sessionId',
  rateLimiters.api,
  itemController.getItemsBySession
);

module.exports = router;
