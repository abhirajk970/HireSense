import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import InterviewRoom from './pages/InterviewRoom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/room/:roomId" element={<InterviewRoom />} />
        <Route path="/" element={<div className="h-screen flex items-center justify-center text-gray-500">HireSense Interview Service</div>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;
