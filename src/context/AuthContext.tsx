
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, UserRole } from "@/types";
import { getItemById, getAllItems } from "@/lib/db";
import { seedUsers } from "@/lib/seed-data";

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
    // Check if user is logged in via localStorage
    const checkUserLoggedIn = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setLoading(false);
      }
    };

    // Initialize database with seed data
    const initializeData = async () => {
      try {
        // Check if users exist, if not seed the database
        const users = await getAllItems<User>("users");
        if (users.length === 0) {
          // Seed initial users if the database is empty
          await seedUsers();
        }
      } catch (error) {
        console.error("Error initializing data:", error);
      }
    };

    initializeData();
    checkUserLoggedIn();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // In a real app, this would verify credentials against a backend
      // For this demo, we'll just fetch users and simulate login
      const users = await getAllItems<User>("users");
      const user = users.find(u => u.email === email);
      
      if (user) {
        setCurrentUser(user);
        // Store user ID in localStorage (simulating a session)
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
        const user = await getItemById<User>("users", parseInt(userId, 10));
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

  const getUserById = async (id: number): Promise<User | null> => {
    try {
      return await getItemById<User>("users", id);
    } catch (error) {
      console.error(`Failed to get user with ID ${id}:`, error);
      return null;
    }
  };

  const getUsersByRole = async (role: UserRole): Promise<User[]> => {
    try {
      const users = await getAllItems<User>("users");
      return users.filter(user => user.role === role);
    } catch (error) {
      console.error(`Failed to get users with role ${role}:`, error);
      return [];
    }
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      loading, 
      login, 
      logout,
      checkAuth,
      getUserById,
      getUsersByRole
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
