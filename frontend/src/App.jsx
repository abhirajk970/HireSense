import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CandidateDashboard from "./pages/CandidateDashboard";
import CompanyDashboard from "./pages/CompanyDashboard";
import Applications from "./pages/Applications";
import Applicants from "./pages/Applicants";
import JobApplication from "./pages/JobApplication";
import CandidateProfile from "./pages/CandidateProfile";
import DSAPractice from "./pages/DSAPractice";
import ProblemSolver from "./pages/ProblemSolver";
import InterviewerDashboard from "./pages/InterviewerDashboard";
import SettingsPage from "./pages/SettingsPage";
import OfferLetterPage from "./pages/OfferLetterPage";
import ProtectedRoute from "./components/ProtectedRoute";
import DemoAssessment from "./pages/DemoAssessment";
import DemoAIInterview from "./pages/DemoAIInterview";
import DemoChecklist from "./components/DemoChecklist";

function App() {
  return (
    <BrowserRouter>
      <DemoChecklist />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login/:role" element={<Login />} />
        <Route path="/register/:role" element={<Register />} />
        <Route path="/candidate" element={<ProtectedRoute allowedRole="candidate"><CandidateDashboard /></ProtectedRoute>} />
        <Route path="/company"   element={<ProtectedRoute allowedRole="company"><CompanyDashboard /></ProtectedRoute>} />
        <Route path="/interviewer" element={<ProtectedRoute allowedRole="interviewer"><InterviewerDashboard /></ProtectedRoute>} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/applicants"   element={<Applicants />} />
        <Route path="/apply/:jobId" element={<JobApplication />} />
        <Route path="/profile"   element={<CandidateProfile />} />
        <Route path="/practice"  element={<DSAPractice />} />
        <Route path="/practice/:questionId" element={<ProblemSolver />} />
        <Route path="/offer/:jobId" element={<ProtectedRoute allowedRole="candidate"><OfferLetterPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute allowedRole={["candidate","company","interviewer"]}><SettingsPage /></ProtectedRoute>} />
        <Route path="/demo/assessment/:applicationId/:candidateId" element={<DemoAssessment />} />
        <Route path="/demo/ai-interview/:roomId" element={<DemoAIInterview />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;