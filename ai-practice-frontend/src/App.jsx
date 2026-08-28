import { BrowserRouter, Routes, Route } from "react-router-dom";
import PracticeRoom from "./pages/PracticeRoom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PracticeRoom />} />
        <Route path="/practice/:sessionId" element={<PracticeRoom />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
