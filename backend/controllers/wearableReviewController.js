const wearableReviewService = require('../services/wearableReviewService');

function getReview(req, res, next) {
  try {
    const review = wearableReviewService.getReview(req.userId, req.query.date)
      || wearableReviewService.evaluateDay(req.userId, req.query.date);
    res.json(review);
  } catch (err) {
    next(err);
  }
}

function evaluateReview(req, res, next) {
  try {
    const date = req.body?.date || req.query.date;
    const review = wearableReviewService.evaluateDay(req.userId, date);
    res.json(review);
  } catch (err) {
    next(err);
  }
}

module.exports = { getReview, evaluateReview };
