const express = require('express');
const axios = require('axios');
const router = express.Router();

// Fact checks a provided LLM answer using related pieces of text (to QA pair) from a user's selected web source 
// as ground truth to determine if misinformation is present in the answer.
router.post('/', async (req, res) => {
  const { summary, answer } = req.body;

  try {
    const response = await axios.post('http://127.0.0.1:5005/fact_check', {
      summary,
      answer
    });
    
    res.json({
      message: 'Answer Successfully Fact Checked Using Source',
      summary: response.data.summary,
      answer: response.data.answer,
      fact_check_decision: response.data.fact_check_decision,
      supporting_set: response.data.supporting_set
    });
  } catch (error) {
    console.error('Error calling fact check service:', error);
    return res.status(500).json({ message: 'Server Error calling fact check service' });
  }

});

module.exports = router;
