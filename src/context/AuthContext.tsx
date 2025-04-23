
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, UserRole } from "@/types";
import { getUserById, getAllUsers, getUsersByRole } from "@/integrations/supabase/api";

// Demo users for development when Supabase has no data
const DEMO_USERS: User[] = [
  { 
    id: 1, 
    name: "John Smith", 
    email: "john@example.com", 
    role: "employee" as UserRole, 
    department: "Engineering",
    hierarchy_chain: [1, 2, 5],
    avatar: null
  },
  { 
    id: 2, 
    name: "Sarah Johnson", 
    email: "sarah@example.com", 
    role: "manager" as UserRole, 
    department: "Engineering",
    hierarchy_chain: [2, 5],
    avatar: null
  },
  { 
    id: 3, 
    name: "Mike Davis", 
    email: "mike@example.com", 
    role: "admin" as UserRole, 
    department: "IT",
    hierarchy_chain: [3],
    avatar: null
  },
  { 
    id: 4, 
    name: "Lisa Wilson", 
    email: "lisa@example.com", 
    role: "department_head" as UserRole, 
    department: "Operations",
    hierarchy_chain: [4],
    avatar: null
  }
];

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
      console.log("Attempting to login with email:", email);
      
      // First try to get users from Supabase
      const users = await getAllUsers();
      console.log("Found users from database:", users);
      
      // If we have users in Supabase, use those
      if (users && users.length > 0) {
        // Case-insensitive email comparison
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (user) {
          console.log("User found in database:", user);
          setCurrentUser(user);
          localStorage.setItem("currentUserId", String(user.id));
          return true;
        }
      }
      
      // If no users in Supabase or user not found, fallback to demo users
      console.log("No matching user in database, trying demo users");
      const demoUser = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (demoUser) {
        console.log("Demo user found:", demoUser);
        setCurrentUser(demoUser);
        localStorage.setItem("currentUserId", String(demoUser.id));
        // Also store the demo users list for other parts of the app
        localStorage.setItem("demoUsers", JSON.stringify(DEMO_USERS));
        return true;
      }
      
      console.log("No user found with email:", email);
      return false;
    } catch (error) {
      console.error("Login failed:", error);
      
      // Final fallback if database access fails
      console.log("Database access failed, trying demo users as last resort");
      const demoUser = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (demoUser) {
        console.log("Demo user found as fallback:", demoUser);
        setCurrentUser(demoUser);
        localStorage.setItem("currentUserId", String(demoUser.id));
        localStorage.setItem("demoUsers", JSON.stringify(DEMO_USERS));
        return true;
      }
      
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
        // First try to get user from Supabase
        const user = await getUserById(Number(userId));
        if (user) {
          setCurrentUser(user);
          return true;
        } else {
          // If no user in Supabase, check for demo users
          const demoUsersStr = localStorage.getItem("demoUsers");
          if (demoUsersStr) {
            const demoUsers = JSON.parse(demoUsersStr) as User[];
            const demoUser = demoUsers.find(u => u.id === Number(userId));
            if (demoUser) {
              setCurrentUser(demoUser);
              return true;
            }
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        
        // Fallback to demo users if database access fails
        const demoUsersStr = localStorage.getItem("demoUsers");
        if (demoUsersStr) {
          const demoUsers = JSON.parse(demoUsersStr) as User[];
          const demoUser = demoUsers.find(u => u.id === Number(userId));
          if (demoUser) {
            setCurrentUser(demoUser);
            return true;
          }
        }
      }
    }
    return false;
  };

  // Also update getUserById to check demo users if Supabase fails
  const getLocalUserById = async (id: number): Promise<User | null> => {
    try {
      const user = await getUserById(id);
      if (user) return user;
      
      // Fallback to demo users
      const demoUsersStr = localStorage.getItem("demoUsers");
      if (demoUsersStr) {
        const demoUsers = JSON.parse(demoUsersStr) as User[];
        return demoUsers.find(u => u.id === id) || null;
      }
      return null;
    } catch (error) {
      console.error("Get user by ID failed:", error);
      
      // Last resort fallback
      const demoUsersStr = localStorage.getItem("demoUsers");
      if (demoUsersStr) {
        const demoUsers = JSON.parse(demoUsersStr) as User[];
        return demoUsers.find(u => u.id === id) || null;
      }
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      loading,
      login,
      logout,
      checkAuth,
      getUserById: getLocalUserById,
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
