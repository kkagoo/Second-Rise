require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes       = require('./routes/authRoutes');
const profileRoutes    = require('./routes/profileRoutes');
const checkinRoutes    = require('./routes/checkinRoutes');
const recommendRoutes  = require('./routes/recommendRoutes');
const feedbackRoutes   = require('./routes/feedbackRoutes');
const reflectionRoutes = require('./routes/reflectionRoutes');
const historyRoutes    = require('./routes/historyRoutes');
const errorHandler     = require('./middleware/errorHandler');

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth',       authRoutes);
app.use('/api/profile',    profileRoutes);
app.use('/api/checkin',    checkinRoutes);
app.use('/api/recommend',  recommendRoutes);
app.use('/api/feedback',   feedbackRoutes);
app.use('/api/reflection', reflectionRoutes);
app.use('/api/history',    historyRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Second Rise backend running on port ${PORT}`));
