
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, UserRole } from "@/types";
import { getUserById, getAllUsers, getUsersByRole } from "@/integrations/supabase/api";

// Travel Request Management System Types

// User role types
// Request status types
// Approval action types
// Audit log action types

// User interface
// Travel details interface
// Approval chain step interface
// Version history entry interface
// Travel request interface
// Approval interface
// Ticket option interface
// Audit log interface
// Notification interface

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  getUserById: (id: number) => Promise<User | null>;
  getUsersByRole: (role: UserRole) => Promise<User[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On mount, check for logged-in user in localStorage
    const checkUserLoggedIn = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setLoading(false);
      }
    };
    checkUserLoggedIn();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // For development purposes, we're using a simplified authentication
      // In production, this would use proper authentication APIs
      console.log("Attempting to login with email:", email);
      const users = await getAllUsers();
      console.log("Found users:", users);
      
      // Case-insensitive email comparison
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (user) {
        console.log("User found:", user);
        setCurrentUser(user);
        localStorage.setItem("currentUserId", String(user.id));
        return true;
      }
      
      console.log("No user found with email:", email);
      return false;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUserId");
  };

  const checkAuth = async (): Promise<boolean> => {
    const userId = localStorage.getItem("currentUserId");
    if (userId) {
      try {
        const user = await getUserById(Number(userId));
        if (user) {
          setCurrentUser(user);
          return true;
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      }
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      loading,
      login,
      logout,
      checkAuth,
      getUserById,
      getUsersByRole: getUsersByRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
