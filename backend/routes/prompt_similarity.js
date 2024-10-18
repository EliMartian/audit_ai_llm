const express = require('express');
const axios = require('axios');
const router = express.Router();

// POST route to calculate cosine similarity
router.post('/', async (req, res) => {
  const { question, answer } = req.body;

  console.log("we received that question and answer pair well")
  console.log(question)
  console.log(answer)

  try {
    const response = await axios.post('http://127.0.0.1:5002/similarity', {
      question,
      answer,
    });
    
    res.json({
      message: 'Cosine Similarity Retrieved from Microservice',
      similarityScore: response.data.similarityScore,
      similarityRating: response.data.similarityRating,
      question,
      answer,
    });
  } catch (error) {
    console.error('Error calling similarity service:', error);
    return res.status(500).json({ message: 'Error calculating similarity' });
  }
});

module.exports = router;
