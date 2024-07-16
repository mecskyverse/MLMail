const express = require('express');
const emailRoutes = require('./routes/emailRoutes');
// const { loadModel } = require('./services/aiService');

const app = express();

app.use(express.json());
app.use('/api/emails', emailRoutes);

// const startServer = async () => {
//   await loadModel();
//   console.log('Model loaded successfully');
// };

// startServer();

module.exports = app;
