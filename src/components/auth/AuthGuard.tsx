
import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: string[];
}

const AuthGuard = ({ children, allowedRoles }: AuthGuardProps) => {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        // Redirect to login if not authenticated
        navigate("/login", { state: { from: location } });
        return;
      }
      
      // If there are allowed roles and the user's role is not included
      if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
        // Redirect to unauthorized page
        navigate("/unauthorized");
        return;
      }
      
      setIsAuthorized(true);
    }
  }, [currentUser, loading, navigate, location, allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  // Only render children if authorized
  return isAuthorized ? <>{children}</> : null;
};

export default AuthGuard;
