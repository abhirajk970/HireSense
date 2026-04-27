import { useEffect, useState } from "react";
import axios from "axios";
import DashboardLayout from "../components/DashboardLayout";

function Applicants() {
  const [apps, setApps] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/applications/all")
      .then((res) => setApps(res.data));
  }, []);

  return (
    <DashboardLayout>
      <h1 className="mb-6">Applicants</h1>

      <div className="grid grid-cols-2 gap-6">
        {apps.map((app) => (
          <div key={app._id} className="bg-white p-5 rounded shadow">
            <h2>{app.jobId?.title}</h2>
            <p>Candidate: {app.candidateId?.name}</p>
            <p>Score: {app.resumeScore}%</p>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}

export default Applicants;