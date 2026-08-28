import { Navigate } from "react-router-dom";

// allowedRole can be a string ("candidate") or an array (["company", "interviewer"])
export default function ProtectedRoute({ children, allowedRole }) {
    const token = localStorage.getItem("token");
    const role  = localStorage.getItem("role");
    const isDemo = localStorage.getItem("demoMode") === "true";

    if (!token && !isDemo) {
        const loginRole = Array.isArray(allowedRole) ? allowedRole[0] : (allowedRole || "candidate");
        return <Navigate to={`/login/${loginRole}`} replace />;
    }

    if (allowedRole) {
        const allowed = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
        if (!allowed.includes(role)) {
            return <Navigate to="/" replace />;
        }
    }

    return children;
}
