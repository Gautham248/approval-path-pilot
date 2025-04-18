
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { initializeSeedData } from "@/lib/seed-data";

const Index = () => {
  const navigate = useNavigate();
  const { currentUser, loading } = useAuth();

  useEffect(() => {
    const init = async () => {
      try {
        // Initialize seed data
        await initializeSeedData();
        
        // Redirect based on auth status
        if (!loading) {
          if (currentUser) {
            navigate("/"); // Go to dashboard if authenticated
          } else {
            navigate("/login"); // Go to login if not authenticated
          }
        }
      } catch (error) {
        console.error("Initialization error:", error);
      }
    };

    init();
  }, [navigate, currentUser, loading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to TravelFlow</h1>
        <p className="text-xl text-gray-600">Initializing application...</p>
      </div>
    </div>
  );
};

export default Index;
