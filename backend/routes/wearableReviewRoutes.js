const express = require('express');
const auth = require('../middleware/auth');
const wearableReviewController = require('../controllers/wearableReviewController');

const router = express.Router();

router.use(auth);
router.get('/today', wearableReviewController.getReview);
router.get('/', wearableReviewController.getReview);
router.post('/evaluate', wearableReviewController.evaluateReview);

module.exports = router;
