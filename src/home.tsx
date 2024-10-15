import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 border rounded-lg shadow-lg bg-white">
      <h1 className="text-3xl font-bold text-center mb-6">Welcome to AuditAI</h1>
      <p className="text-lg mb-4">
        AuditAI is a tool designed to help give users the transparency they deserve in evaluating the relevancy, quality, and biases found in 
        an answer that they received as part of asking a question, either to an AI or another source. 
      </p>
      <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
      <ul className="list-disc list-inside mb-4">
        <li>Enter a question and answer in the Audit tool.</li>
        <li>You will receive a quality score including the question similarity (how relevant is the answer to the original question)</li>
        <li>You will receive a bias score including different types of biases that your answer might contain</li>
      </ul>
      <h2 className="text-2xl font-semibold mb-4">Guidelines</h2>
      <ul className="list-disc list-inside mb-4">
        <li>Ensure that the question and answer are related to standard English language applications</li>
        <li>This tool is NOT intended to work with code or any application outside of the standard English language</li>
        <li>Feel free to copy over the answer you wanted audited in its entirety. But beware that some of the bias models
            accept a limited amount of text due to complexity, so make sure that the most relevant part of the answer you want 
            audited appears first when submitting the answer. 
        </li>
      </ul>
      <p className="text-lg mb-4">
        If you're ready to audit your question and answer pair, navigate to the <Link to="/audit" className="text-blue-500 hover:underline">Audit</Link> page.
      </p>
    </div>
  );
};

export default Home;
