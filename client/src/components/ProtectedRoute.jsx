import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
export default function ProtectedRoute({ role }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="grid min-h-screen place-items-center text-maroon-800">
        Loading ConsultIO…
      </div>
    );
  if (!user) return <Navigate to={`/${role}/login`} replace />;
  if (user.role !== role)
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  return <Outlet />;
}
