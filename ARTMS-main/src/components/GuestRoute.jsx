import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import authService from "../services/authService";

/**
 * GuestRoute — only accessible when NOT logged in.
 * If already authenticated, redirect to the user's dashboard.
 */
export default function GuestRoute() {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={authService.getRolePath(role)} replace />;
  }

  return <Outlet />;
}
