import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AIInterviewRoom from './pages/AIInterviewRoom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/room/:roomId" element={<AIInterviewRoom />} />
        <Route path="/" element={<div className="h-screen flex items-center justify-center text-gray-500 font-medium">HireSense AI Interview Service</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
