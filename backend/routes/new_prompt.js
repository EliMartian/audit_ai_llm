const express = require('express');
const natural = require('natural');
const cosineSimilarity = require('compute-cosine-similarity');

const router = express.Router();

// Helper function to create a frequency vector for text
function textToVector(text, tokenizer) {
  const tokens = tokenizer.tokenize(text.toLowerCase());
  const freqMap = {};
  tokens.forEach(token => {
    freqMap[token] = (freqMap[token] || 0) + 1;
  });
  return freqMap;
}

// Helper function to create a vector array from a frequency map
function freqMapToVector(freqMap, allTokens) {
  return allTokens.map(token => freqMap[token] || 0);
}

// Helper function to calculate cosine similarity between two pieces of text
function calculateCosineSimilarity(text1, text2) {
  const tokenizer = new natural.WordTokenizer();

  // Create frequency vectors for both texts
  const freqMap1 = textToVector(text1, tokenizer);
  const freqMap2 = textToVector(text2, tokenizer);

  // Get all unique tokens across both texts
  const allTokens = Array.from(new Set([...Object.keys(freqMap1), ...Object.keys(freqMap2)]));

  // Create the vectors from the frequency maps
  const vector1 = freqMapToVector(freqMap1, allTokens);
  const vector2 = freqMapToVector(freqMap2, allTokens);

  // Calculate cosine similarity
  return cosineSimilarity(vector1, vector2);
}

// POST route to calculate cosine similarity
router.post('/', (req, res) => {
  const { question, answer } = req.body;

  // Calculate cosine similarity between the question and answer
  const similarityScore = calculateCosineSimilarity(question, answer);

  res.json({ 
    message: 'Cosine Similarity Calculated', 
    similarityScore, 
    question, 
    answer 
  });
});

module.exports = router;
