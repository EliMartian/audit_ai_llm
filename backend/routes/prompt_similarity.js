const express = require('express');
const axios = require('axios');
const router = express.Router();

// POST route to calculate cosine similarity
router.post('/', async (req, res) => {
  const { question, answer } = req.body;

  try {
    const response = await axios.post('http://127.0.0.1:5002/similarity', {
      question,
      answer,
    });
    
    res.json({
      message: 'Cosine Similarity Retrieved from Microservice',
      similarityScore: response.data.similarityScore,
      rougeLScore: response.data.rougeLScore,
      similarityRating: response.data.similarityRating,
      similaritySentence: response.data.similaritySentence,
      question,
      answer,
    });
  } catch (error) {
    console.error('Error calling similarity service:', error);
    return res.status(500).json({ message: 'Error calculating similarity' });
  }
});

// POST route to calculate source similarity between source and answer
router.post('/sources', async (req, res) => {
  const { question, source } = req.body;

  try {
    const response = await axios.post('http://127.0.0.1:5002/source_similarity', {
      question,
      source
    });

    res.json({
      similarityScore: response.data.similarityScore,
      question,
      source
    });
  } catch (error) {
    console.error('Error calling source similarity service:', error);
    return res.status(500).json({ message: 'Error calculating source similarity' });
  }
});

module.exports = router;
