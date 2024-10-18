const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

const corsOptions = {
    origin: 'http://localhost:3000', // Allow requests from your frontend
    methods: 'GET,POST,OPTIONS',     // Specify allowed HTTP methods
    allowedHeaders: ['Content-Type'], // Specify allowed headers
};

app.use(cors(corsOptions));

// Ensure OPTIONS requests are handled properly
app.options('*', cors(corsOptions));  // Handle preflight requests

app.use(bodyParser.json());

// Import Routes
const promptRoutes = require('./routes/prompt_similarity');
const searchRoutes = require('./routes/search');

app.use('/prompt_similarity', promptRoutes);
app.use('/search', searchRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
