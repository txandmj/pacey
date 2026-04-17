// app.js

const express = require('express');
const app = express();
const imageRoutes = require('./routes/imageRoutes');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

app.use(cors());
// Middleware to parse JSON requests
app.use(express.json({ limit: '30mb' }));

// Create the uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'images');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Use the image routes
app.use('/api/images', imageRoutes);

// Serve React frontend build
const frontendBuild = path.join(__dirname, 'public');
if (fs.existsSync(frontendBuild)) {
    app.use(express.static(frontendBuild));
    app.get('*', (req, res) => {
        res.sendFile(path.join(frontendBuild, 'index.html'));
    });
}

module.exports = app;
