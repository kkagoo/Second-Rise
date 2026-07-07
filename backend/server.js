require('dotenv').config({ override: true });
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes        = require('./routes/authRoutes');
const profileRoutes     = require('./routes/profileRoutes');
const checkinRoutes     = require('./routes/checkinRoutes');
const recommendRoutes   = require('./routes/recommendRoutes');
const feedbackRoutes    = require('./routes/feedbackRoutes');
const reflectionRoutes  = require('./routes/reflectionRoutes');
const historyRoutes     = require('./routes/historyRoutes');
const videoRoutes       = require('./routes/videoRoutes');
const ouraRoutes        = require('./routes/ouraRoutes');
const whoopRoutes       = require('./routes/whoopRoutes');
const fitbitRoutes      = require('./routes/fitbitRoutes');
const googleFitRoutes   = require('./routes/googleFitRoutes');
const healthRoutes      = require('./routes/healthRoutes');
const biometricsRoutes  = require('./routes/biometricsRoutes');
const watchRoutes       = require('./routes/watchRoutes');
const wearableReviewRoutes = require('./routes/wearableReviewRoutes');
const deleteAccountRoutes       = require('./routes/deleteAccountRoutes');
const adminRoutes               = require('./routes/adminRoutes');
const activityRoutes            = require('./routes/activityRoutes');
const publicResourcesRoutes     = require('./routes/publicResourcesRoutes');
const exportRoutes              = require('./routes/exportRoutes');
const withingsRoutes            = require('./routes/withingsRoutes');
const garminRoutes              = require('./routes/garminRoutes');
const healthConnectRoutes       = require('./routes/healthConnectRoutes');
const healthKitRoutes           = require('./routes/healthKitRoutes');
const errorHandler      = require('./middleware/errorHandler');

const app = express();

// In production the frontend is served from the same origin — no CORS needed.
// In development, allow the Vite dev server.
const allowedOrigins = ['http://localhost:5173', 'http://localhost:3001'];
const corsOptions = {
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(null, true); // allow all origins (Railway URL changes per deploy)
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // explicit preflight for all routes

app.use(express.json());

// Serve admin panel
app.use('/admin-assets', express.static(path.join(__dirname, 'public')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// Health check for Railway
app.get('/api/health', (req, res) => {
  console.log(`[health] ping at ${new Date().toISOString()}`);
  res.json({ status: 'ok' });
});

app.use('/api/auth',        authRoutes);
app.use('/api/profile',     profileRoutes);
app.use('/api/checkin',     checkinRoutes);
app.use('/api/recommend',   recommendRoutes);
app.use('/api/feedback',    feedbackRoutes);
app.use('/api/reflection',  reflectionRoutes);
app.use('/api/history',     historyRoutes);
app.use('/api/videos',      videoRoutes);
app.use('/api/oura',        ouraRoutes);
app.use('/api/whoop',       whoopRoutes);
app.use('/api/fitbit',      fitbitRoutes);
app.use('/api/googlefit',   googleFitRoutes);
app.use('/api/health',      healthRoutes);
app.use('/api/biometrics',  biometricsRoutes);
app.use('/api/watch',       watchRoutes);
app.use('/api/wearable-review', wearableReviewRoutes);
app.use('/api/account',        deleteAccountRoutes);
app.use('/api/admin',          adminRoutes);
app.use('/api/activity',       activityRoutes);
app.use('/api/resources',      publicResourcesRoutes);
app.use('/api/export',         exportRoutes);
app.use('/api/withings',       withingsRoutes);
app.use('/api/garmin',         garminRoutes);
app.use('/api/health-connect', healthConnectRoutes);
app.use('/api/healthkit',      healthKitRoutes);

// Serve built React frontend (production)
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Second Rise backend running on port ${PORT}`));
