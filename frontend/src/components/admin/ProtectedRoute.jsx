import { Navigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (user === undefined) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center" data-testid="auth-loading">
        <div className="overline text-muted-foreground">Authenticating…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/admin/login" replace />;
  return children;
};

export default ProtectedRoute;
