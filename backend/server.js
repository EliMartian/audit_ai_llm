const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

const corsOptions = {
    origin: '*',
    methods: 'GET,POST,OPTIONS',
    allowedHeaders: ['Content-Type'],
};

app.use(cors(corsOptions));

// Ensure all requests are handled properly and avoid CORS errors
app.options('*', cors(corsOptions));

app.use(bodyParser.json());

// Import Routes
const similarityRoutes = require('./routes/prompt_similarity');
const sentimentRoutes = require('./routes/prompt_sentiment');
const searchRoutes = require('./routes/search');
const scrapeRoutes = require('./routes/scrape');
const factCheckRoutes = require('./routes/fact_check');

// Actually use those routes
app.use('/prompt_similarity', similarityRoutes);
app.use('/search', searchRoutes);
app.use('/prompt_sentiment', sentimentRoutes)
app.use('/scrape', scrapeRoutes)
app.use('/fact_check', factCheckRoutes)

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
