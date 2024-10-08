const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  const { question, answer } = req.body;
  res.json({ message: 'Data received successfully', question, answer });
});

module.exports = router;