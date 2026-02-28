const express = require('express');
const auth = require('../middleware/auth');
const { getProfile, updateProfile } = require('../controllers/profileController');

const router = express.Router();
router.use(auth);
router.get('/', getProfile);
router.put('/', updateProfile);

module.exports = router;
