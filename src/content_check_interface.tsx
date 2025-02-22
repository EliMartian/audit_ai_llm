import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestionCircle, faLink } from '@fortawesome/free-solid-svg-icons';

const ContentChecker: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [similarityScore, setSimilarityScore] = useState<number | null>(null);
  const [similarityRating, setSimilarityRating] = useState<string>('');
  const [similaritySentence, setSimilaritySentence] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSimilarityModalOpen, setIsSimilarityModalOpen] = useState(false); // Pop-up ? visibility screen for Similarity Explanation
  const [isSourceModalOpen, setSourceModalOpen] = useState(false); // Pop-up ? visibility screen for Source Can't Be Used Explanation
  const [searchResults, setSearchResults] = useState<any[]>([]); // Stores Google Search API results
  const [clickedIndices, setClickedIndices] = useState<number[]>([]); // State to track multiple clicked results
  const [resultsToShow, setResultsToShow] = useState(5); // Slider value state
  const [similarityScores, setSimilarityScores] = useState<{ [key: number]: number | null }>({});
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [auditClicked, setAuditClicked] = useState(false);
  const [selectedSources, setSelectedSources] = useState<Source[]>([]);  // Explicit type for selectedSources
  interface SentimentData {
    message: String;
    question_sentiment: String;
    question_emotion: String;
    answer_sentiment: String;
    answer_emotion: String;
    question: String;
    answer: String;
  }
  interface Source {
    title: string;
    link: string;
    topQuestionSentences: [number, string][];
    topAnswerSentence: [number, string][];
    summary: string[];
    factualDecision: string;
  }

  // Fetches similarity score using cosine similarity and word / sentence embeddings
  const fetchSimilarity = async (question: string, answer: string) => {
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
      setSimilarityScore(parseFloat(data.similarityScore));
      setSimilarityRating(data.similarityRating);
      setSimilaritySentence(data.similaritySentence);
      setError(null);
    } catch (error) {
      console.error('Error fetching similarity:', error);
      setError('Error calculating similarity');
    }
  };

  // Fetches sentiment score using Go Emotions dataset
  const fetchSentiment = async (question: string, answer: string) => {
    try {
      const response = await fetch('http://localhost:5001/prompt_sentiment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question, answer }),
      });

      if (!response.ok) {
        throw new Error('Error occurred while fetching sentiment');
      }

      const data: SentimentData = await response.json();
      setSentiment(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching QA pair sentiment:', error);
      setError('Error calculating sentiment');
    }
  };

  // Fetches search results using Google Search API
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

  // Handles the submit button for initial QA pair
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await fetchSimilarity(question, answer);
    await fetchSentiment(question, answer);
    await fetchSearchResults(question);
  };

  // Scrapes the website url provided using Beautiful Soup and other parsing methods
  const scrapeWebsite = async (url: string, sentence_bound: number, question: string, answer: string) => {
    try {
      const response = await fetch('http://localhost:5001/scrape', {
        method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url, sentence_bound, question, answer }),
      });

      if (!response.ok) {
        throw new Error('Error occurred while fetching scrape results');
      }

      const data = await response.json();
      setError(null);
      return data
    } catch (error) {
      console.error('Error scraping sources', error);
      return null;
    }
  }

  // Fact checks the answer by comparing against snippets from provided user source (Internet link)
  // to see if the answer (claim) is supported by the evidence (source that the user chose and top related sentences to QA Pair being audited)
  const factCheckAnswer = async (summary: string[], answer: string) => {
    try {
      const response = await fetch('http://localhost:5005/fact_check', {
        method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ summary, answer }),
      });

      if (!response.ok) {
        throw new Error('Error occurred while fetching fact check results');
      }

      const data = await response.json();
      setError(null);
      return data
    } catch (error) {
      console.error('Error fact checking answer using source: ', error);
      return null;
    }
  }

  // Handles audit button click, including collecting the top related sentences to the question
  // and answer within that selected source
  const handleAuditClick = async () => {
    setAuditClicked(true)

    // Count total number of sentences in the answer to determine how hard we should search
    // ie reduce unnecessary computation time
    const sentenceBound = countSentences(answer)
    const updatedSelectedSources = [...selectedSources];

    for (let i = 0; i < clickedIndices.length; i++) {
      const index = clickedIndices[i];

      // Check if the source is already in selectedSources before scraping
      const existingSource = updatedSelectedSources.find(
        (source) => source.link === searchResults[index].link
      );

      if (existingSource) {
        continue;  // Skip the current iteration if the source is already added
      }
    
      try {
        const data = await scrapeWebsite(searchResults[index].link, sentenceBound, question, answer);
        if (!data.top_2_correlated_question_sentences) {
          // If the top 2 correlated question sentences is null, set the top 2 related question sentences as empty
          data.top_2_correlated_question_sentences = []
        }

        if (!data.most_correlated_answer_sentence) {
          // If the top correlated answer sentence is null, set as empty
          data.most_correlated_answer_sentence = []
        }

        // Otherwise, if data is valid and can be parsed, push the source title and its top 4 sentences to selectedSources array
        if (data && data.most_correlated_answer_sentence.length > 0 && data.top_2_correlated_question_sentences.length > 0) {
          // Extract the top 2 similar question sentence text from the array (not the similarity score)
          const questionSentences: string[] = data.top_2_correlated_question_sentences.map(
            ([score, sentence]: [number, string]) => sentence
          );

          // Combine question sentences with the answer sentence into one summary (ie to use for summarizing the relevant bits of the whole article)
          const summary: string[] = [...questionSentences, data.most_correlated_answer_sentence];

          // Attempt to fact check the answer
          try {
            const fact_data = await factCheckAnswer(summary, answer);
            const factual_decision = fact_data.fact_check_decision;

            // If a factual_decision can be reached (ie is the answer supported by user's source article or not)
            // then update selectedSources with corresponding info
            updatedSelectedSources.push({
              title: searchResults[index].title,
              link: searchResults[index].link,
              topQuestionSentences: data.top_2_correlated_question_sentences,
              topAnswerSentence: data.most_correlated_answer_sentence,
              summary: summary,
              factualDecision: factual_decision
            });
              
          } catch (error) {
            console.error(`Error fact-checking website for ${searchResults[index].title}:`, error);
          }
        } else {
          // If the article could not be parsed (ie invalid web format, anti-bot scraping detection, etc.), 
          // Push placeholders for invalid data
          updatedSelectedSources.push({
            title: searchResults[index].title,
            link: searchResults[index].link,
            topQuestionSentences: [],
            topAnswerSentence: [],
            summary: ["No valid data available"],
            factualDecision: "N/A",
          });
        }
      } catch (error) {
        console.error(`Error scraping website for ${searchResults[index].title}:`, error);
      }
    }
    // Update selected sources, and end the auditing process (for this cycle)
    setSelectedSources(updatedSelectedSources);
    setAuditClicked(false);
  };

  // Calculates similarity score between question and selected source title
  const fetchSourceSimilarity = async (question: string, source: string) => {
    try {
      const response = await fetch('http://localhost:5001/prompt_similarity/sources', {
        method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ question, source }),
      });

      if (!response.ok) {
        throw new Error('Error occurred while fetching similarity of source result');
      }

      const data = await response.json();
      
      setError(null);
      return data.similarityScore
    } catch (error) {
      console.error('Error fetching source similarity:', error);
      return null;
    }
  };

  // Calculates the similarity for all search results currently being displayed to the user
  const calculateSimilarityForResults = async () => {
    const scores = await Promise.all(
      searchResults.map((result, index) =>
        fetchSourceSimilarity(question, result.title).then(score => ({
          index,
          score,
        }))
      )
    );

    // Updates the state of similarity scores
    const scoresMap = scores.reduce((acc, { index, score }) => {
      acc[index] = score;
      return acc;
    }, {} as { [key: number]: number | null });

    setSimilarityScores(scoresMap);
  };

  // Trigger the similarity check when component mounts or search results change
  React.useEffect(() => {
    if (searchResults.length > 0) {
      calculateSimilarityForResults();
    }
  }, [searchResults]);

  // Handles similarity modal visibility to update display for users
  const toggleModal = () => setIsSimilarityModalOpen(!isSimilarityModalOpen);

  // Handles source can't be rendered visibility to update for users
  const toggleSourceModal = () => setSourceModalOpen(!isSourceModalOpen);

  // Function to count sentences based on the period '.' character (ie delimiter for sentences)
  const countSentences = (text: string): number => {
    // Split by period, filter out empty strings, and return the length
    return text.split('.').filter(sentence => sentence.trim() !== '').length;
  };

  // Function to toggle clicked state for a given index
  const handleResultClick = (index: number) => {
    setClickedIndices((prevIndices) =>
      prevIndices.includes(index)
         // Remove index if it's already clicked (ie toggle off)
        ? prevIndices.filter((i) => i !== index)
        // Add index if it's not clicked (ie toggle on)
        : [...prevIndices, index] 
    );
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 border rounded-lg shadow-lg bg-white">
      <h1 className="text-2xl font-bold text-center mb-6">AuditAI </h1>
      <form onSubmit={handleSubmit}>
        {/* Question Section */}
        <div className="mb-4">
          <label htmlFor="question" className="block text-sm font-medium mb-2">Question:</label>
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-32 overflow-y-auto"
            placeholder="Enter your question here"
            required
          />
        </div>
  
        {/* Answer Section */}
        <div className="mb-4">
          <label htmlFor="answer" className="block text-sm font-medium mb-2">Answer:</label>
          <textarea
            id="answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-32 overflow-y-auto"
            placeholder="Enter the answer here"
            required
          />
        </div>
  
        {/* Range Slider */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Number of Sources To Search:</label>
          <input
            type="range"
            min="1"
            max="10"
            value={resultsToShow}
            onChange={(e) => setResultsToShow(Number(e.target.value))}
            className="w-full accent-blue-500 appearance-none h-2 rounded-lg bg-gray-200"
            style={{
              accentColor: "#3b82f6",
              cursor: "pointer",
            }}
          />
          <p className="text-center text-blue-500 text-lg font-semibold mt-2">{resultsToShow}</p>
        </div>
  
        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition duration-300"
        >
          Submit
        </button>
  
        {/* Similarity Results */}
        {similarityScore !== null && (
          <div className={`mt-6 p-4 border rounded-lg ${similarityScore < 0.4 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            <h2 className={`text-xl font-bold ${similarityScore < 0.4 ? 'text-red-700' : 'text-green-700'}`}>
              Similarity Results
            </h2>
            <p className={`${similarityScore < 0.4 ? 'text-red-800' : 'text-green-800'} mt-1`}>
              Similarity Rating: {similarityRating}
              <span className="ml-2 relative group cursor-pointer" onClick={toggleModal}>
                <FontAwesomeIcon icon={faQuestionCircle} className="text-blue-500 hover:text-blue-700" />
              </span>
            </p>
            <p className={`${similarityScore < 0.4 ? 'text-red-800' : 'text-green-800'} mt-1`}>
              Similarity Sentence: {similaritySentence}
            </p>
          </div>
        )}
  
        {/* Similarity Modal */}
        {isSimilarityModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white p-6 border rounded-lg shadow-lg max-w-md mx-auto">
              <h2 className="text-xl font-bold mb-4">How is this calculated?</h2>
              <p>The similarity score is calculated using the cosine similarity score between the question and the answer.</p>
              <p>This score indicates how closely related the question and answer are based upon understanding the semantic meaning behind each sentence.</p>
              <button onClick={toggleModal} className="mt-4 py-2 px-4 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition duration-300">
                Close
              </button>
            </div>
            <div className="fixed inset-0 bg-black opacity-5" onClick={toggleModal} />
          </div>
        )}

        {/* Source Can't Be Used Modal */}
        {isSourceModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white p-6 border rounded-lg shadow-lg max-w-md mx-auto">
              <h2 className="text-xl font-bold mb-4">Why can't this source be used?</h2>
              <p>Some sources have laws and protection against automated website scraping and data use, such as Reddit. 
                Additionally, some sources might have a website format that doesn't follow standardized practices, and thus can't be used.</p>
              <br></br>
              <h2 className="text-xl font-bold mb-4">So what can I do?</h2>
              <p>Fortunately, you can increase the number of sources searched, and select more sources to audit.</p>
              <button onClick={toggleSourceModal} className="mt-4 py-2 px-4 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition duration-300">
                Close
              </button>
            </div>
            <div className="fixed inset-0 bg-black opacity-5" onClick={toggleSourceModal} />
          </div>
        )}
  
        {/* Sentiment Analysis */}
        {sentiment && (
          <div className="mt-6 p-4 border rounded-lg bg-blue-100">
            <h2 className="text-xl font-bold text-blue-700">Sentiment Analysis</h2>
            <p className={`mt-2 ${sentiment.question_sentiment === 'Positive' ? 'text-green-600' : sentiment.question_sentiment === 'Negative' ? 'text-red-600' : 'text-blue-600'}`}>
              Question Sentiment: {sentiment.question_sentiment}
            </p>
            <p className={`mt-2 ${sentiment.question_sentiment === 'Positive' ? 'text-green-600' : sentiment.question_sentiment === 'Negative' ? 'text-red-600' : 'text-blue-600'}`}>
              Question Emotion: {sentiment.question_emotion}
            </p>
            <p className={`mt-2 ${sentiment.answer_sentiment === 'Positive' ? 'text-green-600' : sentiment.answer_sentiment === 'Negative' ? 'text-red-600' : 'text-blue-600'}`}>
              Answer Sentiment: {sentiment.answer_sentiment}
            </p>
            <p className={`mt-2 ${sentiment.answer_sentiment === 'Positive' ? 'text-green-600' : sentiment.answer_sentiment === 'Negative' ? 'text-red-600' : 'text-blue-600'}`}>
              Answer Emotion: {sentiment.answer_emotion}
            </p>
          </div>
        )}
  
        {/* Search Results and Source Content Comparison for Auditing Purposes */}
        <div className="mt-6">
          {searchResults.length > 0 && (
            <div>
              {searchResults.slice(0, resultsToShow).map((result, index) => (
                <div 
                  key={index} 
                  onClick={() => handleResultClick(index)} 
                  className={`mt-2 p-3 border rounded-md ${clickedIndices.includes(index) ? 'bg-blue-300' : 'bg-blue-100'} bg-opacity-70 text-black cursor-pointer`}
                >
                  <div className="flex items-center">
                    <span className="flex-grow">{result.title}</span>
                    <a href={result.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 ml-2 hover:underline flex items-center">
                      <FontAwesomeIcon icon={faLink} className="w-5 h-5" />
                    </a>
                    {similarityScores[index] !== undefined && (
                      <div className={`ml-4 p-2 border rounded-md ${similarityScores[index] !== null && similarityScores[index]! >= 0.4 ? 'bg-blue-200 text-blue-700' : 'bg-red-200 text-red-700'}`}>
                        {similarityScores[index] !== null ? `${(similarityScores[index]! * 100).toFixed(1)}% match` : 'N/A'}
                      </div>
                    )}
                  </div>

                  {/* Check if the source is selected and the index is part of clickedIndices */}
                  {selectedSources.some((source) => source.title === result.title) && clickedIndices.includes(index) && (
                    <div className="mt-4 pl-4">
                      {/* Display source can't be used message if topQuestionSentences is null, undefined, or empty */}
                      {(selectedSources.find((source) => source.title === result.title)?.topQuestionSentences === null ||
                        !selectedSources.find((source) => source.title === result.title)?.topQuestionSentences ||
                        selectedSources.find((source) => source.title === result.title)?.topQuestionSentences.length === 0) && (
                        <div className="mt-2 text-gray-500 flex items-center">
                          This Selected Source Can't be Summarized
                          <span className="ml-2 relative group cursor-pointer" onClick={toggleSourceModal}>
                            <FontAwesomeIcon icon={faQuestionCircle} className="text-blue-500 hover:text-blue-700" />
                          </span>
                        </div>
                      )}
                      {(selectedSources.find((source) => source.title === result.title)?.topQuestionSentences?.length ?? 0) > 0 && (
                        <div className="mb-2 p-2 border rounded-md bg-gray-100 font-semibold">
                          Top Sentences Similar to Your Question:
                        </div>
                      )}
                      {/* Render the most similar sentences to the question */}
                      {selectedSources.find((source) => source.title === result.title)?.topQuestionSentences?.map((sentenceData, sentIndex) => (
                        <div key={sentIndex} className="mb-2 p-2 border rounded-md bg-gray-100">
                          <span>{sentenceData[1]}</span>
                        </div>
                      ))}
                      {(selectedSources.find((source) => source.title === result.title)?.topAnswerSentence?.length ?? 0) > 0 && (
                        <div className="mb-2 p-2 border rounded-md bg-gray-100 font-semibold">
                          Top Sentence Similar to Your Answer:
                        </div>
                      )}
                      {/* Render the most similar sentence to the answer */}
                      {(selectedSources.find((source) => source.title === result.title)?.topAnswerSentence?.length ?? 0) > 0 && (
                        <div className="mb-2 p-2 border rounded-md bg-gray-100">
                          <span>{selectedSources.find((source) => source.title === result.title)?.topAnswerSentence}</span>
                        </div>
                      )}
                      {/* Render the decision of whether the Source Article supports, or refutes, the Answer being audited in the QA pair */}
                      {(selectedSources.find((source) => source.title === result.title)?.factualDecision !== undefined) && 
                        (selectedSources.find((source) => source.title === result.title)?.topQuestionSentences?.length ?? 0) > 0 && (
                        <div className="mb-2 p-2 border rounded-md bg-gray-100 font-semibold">
                          The Audited Answer is: 
                          <span
                            className={`font-bold ${
                              selectedSources.find((source) => source.title === result.title)?.factualDecision 
                                ? 'text-green-800' 
                                : 'text-red-800'
                            }`}
                          >
                            {selectedSources.find((source) => source.title === result.title)?.factualDecision ? " Supported" : " Refuted"}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {similarityScore !== null && similarityScore >= 0.4 && (
                <div className="flex justify-center items-center">
                {auditClicked ? (
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-opacity-50"></div>
                  </div>
                ) : (
                  <button
                    onClick={handleAuditClick}
                    className="w-full py-2 px-4 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition duration-300"
                  >
                    Audit Using These Sources
                  </button>
                )}
                </div>
              )}
            </div>
          )}
        </div>

  
        {/* Error Message */}
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