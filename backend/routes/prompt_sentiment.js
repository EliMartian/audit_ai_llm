const express = require('express');
const axios = require('axios');
const router = express.Router();

// POST route to calculate the sentiment of the question and answer pair
router.post('/', async (req, res) => {
  const { question, answer } = req.body;

  try {
    const response = await axios.post('http://127.0.0.1:5003/sentiment', {
      question,
      answer,
    });
    
    res.json({
      message: 'Sentiment Analysis Retrieved from Microservice',
      question_sentiment: response.data.question_sentiment,
      answer_sentiment: response.data.answer_sentiment,
      question,
      answer,
    });
  } catch (error) {
    console.error('Error calling sentiment service:', error);
    return res.status(500).json({ message: 'Error calculating prompt sentiment' });
  }
});

module.exports = router;
