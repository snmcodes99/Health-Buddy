const multer = require('multer');
const { ValidationError } = require('../utils/errors');
const { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } = require('../config/constants');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!file || !file.mimetype) {
    return cb(new ValidationError('Invalid file upload'), false);
  }

  const mime = file.mimetype.toLowerCase().split(';')[0];

  if (ALLOWED_FILE_TYPES.includes(mime)) {
    cb(null, true);
  } else {
    cb(new ValidationError(`Invalid file type. Allowed: ${ALLOWED_FILE_TYPES.join(', ')}`), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter
});

const checkFileUploaded = (req, res, next) => {
  if (!req.file) {
    return next(new ValidationError('No file uploaded'));
  }
  next();
};


module.exports = {
  upload,
  checkFileUploaded
};
