const express = require('express');
const auth = require('../middleware/auth');
const {
  getResources, getBookmarks, bookmarkResource, unbookmarkResource,
} = require('../controllers/publicResourcesController');

const router = express.Router();
router.use(auth);

router.get('/',               getResources);
router.get('/bookmarks',      getBookmarks);
router.post('/:id/bookmark',  bookmarkResource);
router.delete('/:id/bookmark', unbookmarkResource);

module.exports = router;
