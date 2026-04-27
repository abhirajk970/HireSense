import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CandidateDashboard from "./pages/CandidateDashboard";
import CompanyDashboard from "./pages/CompanyDashboard";
import Applications from "./pages/Applications";
import Applicants from "./pages/Applicants";
import JobApplication from "./pages/JobApplication";
import MCQTest from "./pages/MCQTest";
import CandidateProfile from "./pages/CandidateProfile";
import DSAPractice from "./pages/DSAPractice";
import ProblemSolver from "./pages/ProblemSolver";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login/:role" element={<Login />} />
        <Route path="/register/:role" element={<Register />} />
        <Route path="/candidate" element={<ProtectedRoute allowedRole="candidate"><CandidateDashboard /></ProtectedRoute>} />
        <Route path="/company" element={<ProtectedRoute allowedRole="company"><CompanyDashboard /></ProtectedRoute>} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/applicants" element={<Applicants />} />
        <Route path="/apply/:jobId" element={<JobApplication />} />
        <Route path="/test/:testId/application/:applicationId" element={<MCQTest />} />
        <Route path="/profile" element={<CandidateProfile />} />
        <Route path="/practice" element={<DSAPractice />} />
        <Route path="/practice/:questionId" element={<ProblemSolver />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;