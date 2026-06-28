const wearableReviewService = require('../services/wearableReviewService');

function getReview(req, res, next) {
  try {
    const cached = wearableReviewService.getReview(req.userId, req.query.date);
    // Re-evaluate if no row yet, or if status is unknown (copy may have improved
    // since it was last written — e.g. self-report data now available)
    const review = (!cached || cached.adherence_status === 'unknown')
      ? wearableReviewService.evaluateDay(req.userId, req.query.date)
      : cached;
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
