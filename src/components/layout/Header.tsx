
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { MobileMenu } from "./MobileMenu";
import { NotificationsMenu } from "./NotificationsMenu";
import { UserMenu } from "./UserMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import { useWorkflow } from "@/context/WorkflowContext";

const Header = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { getPendingApprovals } = useWorkflow();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPendingCount = async () => {
      if (!currentUser) return;
      
      try {
        const pendingRequests = await getPendingApprovals(currentUser.id);
        setPendingCount(pendingRequests.length);
      } catch (error) {
        console.error("Error fetching pending approvals:", error);
      }
    };
    
    fetchPendingCount();
    
    // Set up interval to check for new pending approvals every 5 minutes
    const intervalId = setInterval(fetchPendingCount, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [currentUser, getPendingApprovals]);
  
  const isLoginPage = location.pathname === "/login";

  return (
    <header className="bg-white border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">Xpress</span>
            </Link>
            
            {!isMobile && currentUser && (
              <nav className="hidden md:flex items-center space-x-6">
                <Link
                  to="/dashboard"
                  className={`text-sm font-medium ${
                    location.pathname === "/dashboard"
                      ? "text-blue-600"
                      : "text-gray-700 hover:text-blue-600"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/requests"
                  className={`text-sm font-medium ${
                    location.pathname.startsWith("/requests")
                      ? "text-blue-600"
                      : "text-gray-700 hover:text-blue-600"
                  }`}
                >
                  My Requests
                </Link>
                
                {(currentUser.role === "manager" || 
                  currentUser.role === "du_head" || 
                  currentUser.role === "admin") && (
                  <Link
                    to="/approvals"
                    className={`text-sm font-medium flex items-center ${
                      location.pathname === "/approvals"
                        ? "text-blue-600"
                        : "text-gray-700 hover:text-blue-600"
                    }`}
                  >
                    Approvals
                    {pendingCount > 0 && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">
                        {pendingCount}
                      </span>
                    )}
                  </Link>
                )}
                
                {(currentUser.role === "manager" || 
                  currentUser.role === "du_head" || 
                  currentUser.role === "admin") && (
                  <Link
                    to="/analytics"
                    className={`text-sm font-medium ${
                      location.pathname === "/analytics"
                        ? "text-blue-600"
                        : "text-gray-700 hover:text-blue-600"
                    }`}
                  >
                    Analytics
                  </Link>
                )}
              </nav>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {!isLoginPage && (
              <>
                {currentUser ? (
                  <div className="flex items-center space-x-2">
                    <NotificationsMenu />
                    <UserMenu />
                    {isMobile && <MobileMenu pendingCount={pendingCount} />}
                  </div>
                ) : (
                  <Button asChild size="sm">
                    <Link to="/login">Login</Link>
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
