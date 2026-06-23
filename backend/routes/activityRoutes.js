const express = require('express');
const auth = require('../middleware/auth');
const {
  logActivity, getActivityLog, deleteActivity, exportActivityCSV, getPainHistory,
} = require('../controllers/activityController');

const router = express.Router();
router.use(auth);

router.post('/',            logActivity);
router.get('/',             getActivityLog);
router.get('/export.csv',   exportActivityCSV);
router.get('/pain-history', getPainHistory);
router.delete('/:id',       deleteActivity);

module.exports = router;
