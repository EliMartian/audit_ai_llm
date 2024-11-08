const express = require('express');
const axios = require('axios');
const router = express.Router();

// Performs a scrape on a provided URL to scrape the top most similar sentences and
// put together an excerpt from the source to show the user (ie a preview of whats in the source article)
router.post('/', async (req, res) => {
  // Parse out the associated variables necessary to perform a scrape from the body request 
  const { url, sentence_bound, question, answer } = req.body;

  try {
    const response = await axios.post('http://127.0.0.1:5004/scrape', {
      url,
      sentence_bound,
      question,
      answer
    });
    
    res.json({
      message: 'Content Successfully Scraped From Source',
      related_question_text_excerpt: response.data.related_question_text_excerpt,
      top_related_answer: response.data.top_related_answer
    });
  } catch (error) {
    console.error('Error calling scraping service:', error);
    return res.status(500).json({ message: 'Error calling scraping service' });
  }
});

module.exports = router;
