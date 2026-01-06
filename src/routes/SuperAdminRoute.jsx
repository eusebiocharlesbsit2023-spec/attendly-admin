import { Navigate } from "react-router-dom";

function SuperAdminRoute({ children }) {
  const role = localStorage.getItem("role");

  if (role !== "Super Admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default SuperAdminRoute;
