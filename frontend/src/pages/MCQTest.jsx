import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";

function MCQTest() {
  const { testId, applicationId } = useParams();
  const navigate = useNavigate();
  
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const fetchTestData = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/jobs`);
            const mockTest = {
                questions: [
                    { _id: '1', questionText: "What is the primary role of a backend developer?", options: ["UI Design", "Server Logic", "Marketing", "Data Entry"], correctAnswer: "Server Logic" },
                    { _id: '2', questionText: "Which of these is a database?", options: ["MongoDB", "React", "Express", "Node"], correctAnswer: "MongoDB" },
                    { _id: '3', questionText: "What does API stand for?", options: ["App Process Interface", "Application Programming Interface", "Auto Program Integration", "Apple Pie Ingredients"], correctAnswer: "Application Programming Interface" },
                    { _id: '4', questionText: "Which HTTP method is used to create a resource?", options: ["GET", "POST", "DELETE", "PUT"], correctAnswer: "POST" },
                    { _id: '5', questionText: "What is React primarily used for?", options: ["Database Management", "Building User Interfaces", "Server Configuration", "OS Development"], correctAnswer: "Building User Interfaces" }
                ]
            };
            setTest(mockTest);
        } catch(err) {
            console.error(err);
        }
    };
    fetchTestData();
  }, [testId, applicationId]);

  const handleSelect = (qId, option) => {
    setAnswers({ ...answers, [qId]: option });
  };

  const handleSubmit = async () => {
    let correctCount = 0;
    test.questions.forEach((q) => {
        if(answers[q._id] === q.correctAnswer) {
            correctCount++;
        }
    });

    const finalScore = Math.round((correctCount / test.questions.length) * 100);
    setScore(finalScore);
    setSubmitted(true);

    try {
        await axios.post(`http://localhost:5000/api/applications/${applicationId}/test-score`, {
            score: finalScore
        });
    } catch(err) {
        console.error("Failed to save score:", err);
    }
  };

  if(!test) return <DashboardLayout><div className="flex justify-center p-10"><div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
         
         {!submitted ? (
             <>
                 <div className="mb-8">
                   <h1 className="text-2xl font-bold text-white mb-2">Technical Assessment</h1>
                   <p className="text-gray-500 text-sm pb-4 border-b border-white/[0.06]">Answer the following MCQs. Your score will be sent securely to the employer.</p>
                 </div>
                 
                 {test.questions.map((q, idx) => (
                     <div key={q._id} className="mb-5 bg-white/[0.03] p-6 rounded-2xl border border-white/[0.06] hover:border-white/[0.1] transition-colors">
                         <h3 className="text-base font-bold text-white mb-4 flex items-start">
                             <span className="bg-indigo-500/15 text-indigo-300 w-7 h-7 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 text-sm font-bold border border-indigo-500/20">{idx + 1}</span>
                             {q.questionText}
                         </h3>
                         <div className="space-y-2.5 pl-10">
                             {q.options.map((opt, oIdx) => (
                                 <label key={oIdx} className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all ${answers[q._id] === opt ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-200' : 'border-white/[0.06] hover:bg-white/[0.03] text-gray-400'}`}>
                                     <input 
                                         type="radio" 
                                         name={`question-${q._id}`} 
                                         className="w-4 h-4 text-indigo-500 focus:ring-indigo-500 bg-transparent border-gray-600" 
                                         onChange={() => handleSelect(q._id, opt)}
                                         checked={answers[q._id] === opt}
                                     />
                                     <span className="ml-3 font-medium text-sm">{opt}</span>
                                 </label>
                             ))}
                         </div>
                     </div>
                 ))}

                 <button 
                    onClick={handleSubmit} 
                    disabled={Object.keys(answers).length < test.questions.length}
                    className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all ${Object.keys(answers).length < test.questions.length ? 'bg-gray-700/50 cursor-not-allowed text-gray-500' : 'bg-gradient-to-r from-indigo-500 to-violet-600 hover:shadow-indigo-500/25 hover:-translate-y-0.5'}`}
                 >
                     Submit Assessment
                 </button>
             </>
         ) : (
             <div className="bg-white/[0.03] p-12 rounded-2xl border border-white/[0.06] text-center">
                  <div className="w-16 h-16 bg-emerald-500/15 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                     <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-3">Assessment Complete!</h2>
                  <p className="text-gray-500 mb-10">Your responses have been submitted to the employer.</p>
                  
                  <div className="bg-white/[0.04] rounded-2xl p-8 mb-10 max-w-xs mx-auto border border-white/[0.08]">
                      <p className="text-xs uppercase tracking-[0.2em] font-bold text-gray-500 mb-3">Your Score</p>
                      <div className="flex justify-center items-end">
                         <span className="text-7xl font-black bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">{score}</span>
                         <span className="text-3xl font-bold text-gray-600 mb-2 ml-1">%</span>
                      </div>
                  </div>

                  <button onClick={() => navigate('/candidate')} className="px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold shadow-lg shadow-indigo-500/20 hover:-translate-y-0.5 transition-all text-lg">
                      Return to Dashboard
                  </button>
             </div>
         )}
      </div>
    </DashboardLayout>
  );
}

export default MCQTest;
