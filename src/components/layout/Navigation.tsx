
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export const Navigation = () => {
  const { currentUser } = useAuth();
  
  return (
    <nav className="hidden md:flex items-center space-x-4">
      <Link to="/" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
        Dashboard
      </Link>
      <Link to="/requests" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
        Requests
      </Link>
      {currentUser?.role === "admin" && (
        <Link to="/admin" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
          Admin
        </Link>
      )}
      <Link to="/analytics" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
        Analytics
      </Link>
    </nav>
  );
};
