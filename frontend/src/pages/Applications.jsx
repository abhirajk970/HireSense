import { useEffect, useState } from "react";
import axios from "axios";
import DashboardLayout from "../components/DashboardLayout";

function Applications() {
  const [applications, setApplications] = useState([]);
  const candidateId = localStorage.getItem("userId");

  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/applications?candidateId=${candidateId}`)
      .then((res) => setApplications(res.data));
  }, []);

  return (
    <DashboardLayout>
      <h1 className="mb-6">My Applications</h1>

      <div className="grid grid-cols-2 gap-6">
        {applications.map((app) => (
          <div
            key={app._id}
            className="bg-white p-5 rounded-lg shadow hover:shadow-lg transition"
          >
            <h2 className="font-semibold">{app.jobId?.title}</h2>

            <p className="mt-2">Match Score: {app.resumeScore}%</p>

            <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
              <div
                className="bg-primary h-3 rounded-full"
                style={{ width: `${app.resumeScore}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}

export default Applications;