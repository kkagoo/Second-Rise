const express = require('express');
const auth = require('../middleware/auth');
const { submitFeedback } = require('../controllers/feedbackController');

const router = express.Router();
router.use(auth);
router.post('/', submitFeedback);

module.exports = router;
