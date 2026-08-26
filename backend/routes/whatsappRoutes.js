const express = require('express');
const router  = express.Router();
const { verifyWebhook, handleIncoming } = require('../controllers/whatsappController');

router.get('/',  verifyWebhook);   // Meta webhook verification
router.post('/', handleIncoming);  // Incoming messages

module.exports = router;
