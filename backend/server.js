require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes       = require('./routes/authRoutes');
const profileRoutes    = require('./routes/profileRoutes');
const checkinRoutes    = require('./routes/checkinRoutes');
const recommendRoutes  = require('./routes/recommendRoutes');
const feedbackRoutes   = require('./routes/feedbackRoutes');
const reflectionRoutes = require('./routes/reflectionRoutes');
const historyRoutes    = require('./routes/historyRoutes');
const errorHandler     = require('./middleware/errorHandler');

const app = express();

// In production the frontend is served from the same origin — no CORS needed.
// In development, allow the Vite dev server.
const allowedOrigins = ['http://localhost:5173', 'http://localhost:3001'];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(null, true); // allow all origins (Railway URL changes per deploy)
  },
  credentials: true,
}));

app.use(express.json());

// Health check for Railway
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth',       authRoutes);
app.use('/api/profile',    profileRoutes);
app.use('/api/checkin',    checkinRoutes);
app.use('/api/recommend',  recommendRoutes);
app.use('/api/feedback',   feedbackRoutes);
app.use('/api/reflection', reflectionRoutes);
app.use('/api/history',    historyRoutes);

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
