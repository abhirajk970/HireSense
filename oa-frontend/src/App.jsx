import { BrowserRouter, Routes, Route } from "react-router-dom";
import Assessment from "./pages/Assessment";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/assessment/:applicationId/:candidateId" element={<Assessment />} />
        {/* Fallback route */}
        <Route path="*" element={<div className="p-10 font-sans">Invalid Assessment URL. Please access this from your HireSense Dashboard.</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
