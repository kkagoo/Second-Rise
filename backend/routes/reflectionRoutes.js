const express = require('express');
const auth = require('../middleware/auth');
const { submitReflection } = require('../controllers/reflectionController');

const router = express.Router();
router.use(auth);
router.post('/', submitReflection);

module.exports = router;
