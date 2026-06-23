const express = require('express');
const adminAuth = require('../middleware/adminAuth');
const {
  getStats, getUsers, deleteUser,
  getResources, createResource, updateResource, deleteResource
} = require('../controllers/adminController');

const router = express.Router();

// All admin routes require the X-Admin-Secret header
router.use(adminAuth);

router.get('/stats',               getStats);
router.get('/users',               getUsers);
router.delete('/users/:id',        deleteUser);
router.get('/resources',           getResources);
router.post('/resources',          createResource);
router.put('/resources/:id',       updateResource);
router.delete('/resources/:id',    deleteResource);

module.exports = router;
