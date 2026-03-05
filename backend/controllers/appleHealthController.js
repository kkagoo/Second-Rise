const appleHealthService = require('../services/appleHealthService');

async function uploadExport(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const count = await appleHealthService.parseAndStore(req.userId, req.file.buffer);
    res.json({ days_imported: count });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadExport };
