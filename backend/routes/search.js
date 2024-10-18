const express = require('express');
const axios = require('axios');
const cors = require('cors');
const router = express.Router();

// Enable CORS for all routes
router.use(cors());

router.options('*', cors()); // Enable CORS for all preflight OPTIONS requests

router.post('/', async (req, res) => {
  const { query } = req.body;

  try {
    // Call Google Custom Search API
    const googleSearchResponse = await axios.get(
      `https://www.googleapis.com/customsearch/v1`, {
        params: {
          key: "AIzaSyBB_Im1RFHu4YkeykLx4Shk8rSKgnlRQpI",
          cx: "02ab568b899d449d9",
          q: query,
        },
      }
    );

    // Send search results back to the frontend
    res.json({
      message: 'Google Search Results Retrieved',
      searchResults: googleSearchResponse.data.items,
    });
  } catch (error) {
    console.error('Error calling Google Custom Search API:', error);
    return res.status(500).json({ message: 'Error retrieving search results' });
  }
});

module.exports = router;
