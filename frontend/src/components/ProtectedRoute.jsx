import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // Remember where they were going so login can send them back.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}
