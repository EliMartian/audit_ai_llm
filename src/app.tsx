import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import ContentChecker from './content_check_interface';
import Home from './home';

const App: React.FC = () => {
  return (
    <Router>
      <div>
        {/* Navbar + Routes for AuditAI home page */}
        <nav className="bg-gray-800 p-4">
          <div className="container mx-auto flex justify-between">
            <div className="text-white text-lg font-semibold">
              <Link to="/" className="mr-4 hover:text-blue-400">Home</Link>
              <Link to="/audit" className="hover:text-blue-400">Audit</Link>
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/audit" element={<ContentChecker />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
