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
      // TODO: replace with real auth - for now, just search for user in supabase
      const users = await getAllUsers();
      const user = users.find(u => u.email === email);
      if (user) {
        setCurrentUser(user);
        localStorage.setItem("currentUserId", String(user.id));
        return true;
      }
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
