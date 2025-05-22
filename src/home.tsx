import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 border rounded-lg shadow-lg bg-white">
      <h1 className="text-3xl font-bold text-center mb-6">Welcome to AuditAI</h1>
      <p className="text-lg mb-4">
        AuditAI is a tool designed to help give users the transparency and verifiability they deserve in evaluating 
        an answer they received from asking a question, either to an LLM or another source
      </p>
      <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
      <ul className="list-disc list-inside mb-4">
        <li>Enter a question and answer in the Audit tool</li>
        <li>Choose your sources you want to audit with</li>
        <li>Receive back audit information</li>
      </ul>
      <h2 className="text-2xl font-semibold mb-4">Guidelines</h2>
      <ul className="list-disc list-inside mb-4">
        <li>Ensure that the question and answer are related to standard English language applications and could be verified on the internet</li>
        <li>Feel free to copy over the answer you wanted audited in its entirety. But beware that the tool functions best with summarized sentences that are shorter in length
        </li>
        <li>Always make sure to verify the information presented to you in AuditAI on your own. This is not a definitive audit solution, and should be independently verified</li>
      </ul>
      <p className="text-lg mb-4">
        If you're ready to audit your question and answer pair, navigate to the <Link to="/audit" className="text-blue-500 hover:underline">Audit</Link> page.
      </p>
    </div>
  );
};

export default Home;
