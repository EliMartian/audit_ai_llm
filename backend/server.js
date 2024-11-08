const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

const corsOptions = {
    origin: 'http://localhost:3000', // Allow requests from frontend
    methods: 'GET,POST,OPTIONS',     // Specify allowed HTTP methods
    allowedHeaders: ['Content-Type'], // Specify allowed headers
};

app.use(cors(corsOptions));

// Ensure OPTIONS requests are handled properly
app.options('*', cors(corsOptions));  // Handle preflight requests

app.use(bodyParser.json());

// Import Routes
const similarityRoutes = require('./routes/prompt_similarity');
const sentimentRoutes = require('./routes/prompt_sentiment');
const searchRoutes = require('./routes/search');
const scrapeRoutes = require('./routes/scrape');

// Actually use those routes
app.use('/prompt_similarity', similarityRoutes);
app.use('/search', searchRoutes);
app.use('/prompt_sentiment', sentimentRoutes)
app.use('/scrape', scrapeRoutes)

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
