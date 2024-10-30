import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';

const ContentChecker: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [similarityScore, setSimilarityScore] = useState<number | null>(null);
  const [similarityRating, setSimilarityRating] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSimilarityModalOpen, setIsSimilarityModalOpen] = useState(false); // Pop-up ? visibility screen for Similarity Explanation
  const [searchResults, setSearchResults] = useState<any[]>([]); // Stores Google Search API results
  const [resultsToShow, setResultsToShow] = useState(5); // Slider value state

  // Helper function to fetch similarity score
  const fetchSimilarity = async (question: string, answer: string) => {
    // Create payload with QA pair
    const payload = {
      question,
      answer
    };  

    try {
      const response = await fetch('http://localhost:5001/prompt_similarity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question, answer }),
      });

      if (!response.ok) {
        throw new Error('Error occurred while fetching similarity');
      }

      const data = await response.json();
      setSimilarityScore(parseFloat(data.similarityScore.toFixed(2)));
      setSimilarityRating(data.similarityRating);
      setError(null);
    } catch (error) {
      console.error('Error fetching similarity:', error);
      setError('Error calculating similarity');
    }
  };

  // Helper function to fetch search results
  const fetchSearchResults = async (query: string) => {
    try {
      const response = await fetch('http://localhost:5001/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error('Error occurred while fetching search results');
      }

      const data = await response.json();
      setSearchResults(data.searchResults);
      setError(null);
    } catch (error) {
      console.error('Error fetching search results:', error);
      setError('Error retrieving search results');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await fetchSimilarity(question, answer);
    await fetchSearchResults(question);
  };

  // Handles similarity modal visibility to update display for users
  const toggleModal = () => setIsSimilarityModalOpen(!isSimilarityModalOpen);

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 border rounded-lg shadow-lg bg-white">
      <h1 className="text-2xl font-bold text-center mb-6">AuditAI </h1>
      <form onSubmit={handleSubmit}>

        {/* Designated question location, so that the user can provide their question that they asked to AI (or another source) that
            they want the associated response they received audited */}
        <div className="mb-4">
          <label htmlFor="question" className="block text-sm font-medium mb-2">Question:</label>
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your prompt here"
            required
          />
        </div>

        {/* Designated answer location, so that the user can provide the answer from AI (or another source) that
            they wanted audited */}
        <div className="mb-4">
          <label htmlFor="answer" className="block text-sm font-medium mb-2">Answer:</label>
          <textarea
            id="answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter the answer here"
            required
          />
        </div>

        {/* Slider for results count that the user wants to use for auditing their QA pair*/}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Number of Sources To Search:</label>
          <input
            type="range"
            min="1"
            max="10"
            value={resultsToShow}
            onChange={(e) => setResultsToShow(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
          <p className="text-center">{resultsToShow}</p>
        </div>

        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition duration-300"
        >
          Submit
        </button>

        {/* Display the similarity score and rating */}
        {similarityScore !== null && (
          <div className={`mt-6 p-4 border rounded-lg ${similarityScore < 0.4 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            <h2 className={`text-xl font-bold ${similarityScore < 0.4 ? 'text-red-700' : 'text-green-700'}`}>
              Similarity Results
            </h2>
            {/* If the question and answer pair are dissimilar, display the similarity score in red. Otherwise if similiar
                display the similarity score in green. Also displays score as a percentage for ease of clarity for user. */}
            <p className={`mt-2 ${similarityScore < 0.4 ? 'text-red-600' : 'text-green-600'}`}>
              Similarity Score: {(similarityScore * 100) + "%"}
              <span 
                className="ml-2 relative group cursor-pointer" 
                onClick={toggleModal}
              >
                {/* Include hoverable ? icon so that users can see the explanation behind the similarity score, ie the Similarity Modal */}
                <FontAwesomeIcon icon={faQuestionCircle} className="text-blue-500 hover:text-blue-700" />
              </span>
            </p>
            <p className={`${similarityScore < 0.4 ? 'text-red-800' : 'text-green-800'} mt-1`}>
              Similarity Rating: {similarityRating}
            </p>
          </div>
        )}

        {/* Similarity Modal for brief explanation of how the similarity score was calculated */}
        {isSimilarityModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white p-6 border rounded-lg shadow-lg max-w-md mx-auto">
              <h2 className="text-xl font-bold mb-4">How is this calculated?</h2>
              <p>
                The similarity score is calculated using the cosine similarity score between
                the question and the answer.
              </p>
              <br></br>
              <p>
                This score indicates how closely related
                the question and answer are on a scale from 0 to 100%.
              </p>
              <button 
                onClick={toggleModal}
                className="mt-4 py-2 px-4 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition duration-300"
              >
                Close
              </button>
            </div>
            {/* Includes a hint of opacity so users have another cue that can visually tell them new content is on the screen, 
                could be useful for accessibility and ease of use purposes */}
            <div 
              className="fixed inset-0 bg-black opacity-5"
              onClick={toggleModal}
            />
          </div>
        )}

        {/* Display Search Result Titles */}
        <div className="mt-6">
          {searchResults.length > 0 && (
            <div>
              {searchResults.slice(0, resultsToShow).map((result, index) => (
                <div key={index} className="mt-2 p-3 border rounded-md bg-blue-100 bg-opacity-70 text-black">
                  {result.title}
                </div>
              ))}
            </div>
          )}
        </div>


        {/* Display any error from the backend */}
        {error && (
          <div className="mt-6 p-4 border rounded-lg bg-red-100">
            <p className="text-red-600">{error}</p>
          </div>
        )}
      </form>
    </div>
  );
};

export default ContentChecker;