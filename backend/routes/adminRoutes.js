const express = require('express');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const {
  getStats, getCohortTrends,
  getUsers, deleteUser,
  getResources, createResource, updateResource, deleteResource,
} = require('../controllers/adminController');

const router = express.Router();

// All admin routes require a valid JWT + is_admin flag
router.use(auth);
router.use(adminAuth);

router.get('/stats',               getStats);
router.get('/trends',              getCohortTrends);
router.get('/users',               getUsers);
router.delete('/users/:id',        deleteUser);
router.get('/resources',           getResources);
router.post('/resources',          createResource);
router.put('/resources/:id',       updateResource);
router.delete('/resources/:id',    deleteResource);

module.exports = router;
