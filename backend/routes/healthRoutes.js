const express               = require('express');
const router                = express.Router();
const multer                = require('multer');
const auth                  = require('../middleware/auth');
const appleHealthController = require('../controllers/appleHealthController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

router.post('/apple', auth, upload.single('export'), appleHealthController.uploadExport);

module.exports = router;
