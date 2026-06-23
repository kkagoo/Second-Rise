const express = require('express');
const auth = require('../middleware/auth');
const { deleteAccount } = require('../controllers/deleteAccountController');

const router = express.Router();

// DELETE /api/account  — permanently deletes the authenticated user and all their data
router.delete('/', auth, deleteAccount);

module.exports = router;
