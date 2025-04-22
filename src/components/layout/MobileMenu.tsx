
import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { getInitials, getRoleLabel } from "@/lib/utils/formatters";

interface MobileMenuProps {
  pendingCount?: number;
}

export const MobileMenu = ({ pendingCount }: MobileMenuProps) => {
  const { currentUser, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!currentUser) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-64 p-0">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <span className="text-lg font-semibold">Menu</span>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center">
              <Avatar className="h-10 w-10">
                <AvatarImage src={currentUser.avatar} />
                <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="text-base font-medium text-gray-900">{currentUser.name}</p>
                <p className="text-sm text-gray-500">{getRoleLabel(currentUser.role)}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-2 py-4 bg-white space-y-1">
            <Link 
              to="/dashboard" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              Dashboard
            </Link>
            <Link 
              to="/requests" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              Requests
            </Link>
            {(currentUser.role === "manager" || currentUser.role === "du_head" || currentUser.role === "admin") && (
              <Link 
                to="/approvals" 
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100 flex items-center"
                onClick={() => setIsOpen(false)}
              >
                <span>Approvals</span>
                {pendingCount && pendingCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </Link>
            )}
            {(currentUser.role === "manager" || currentUser.role === "du_head" || currentUser.role === "admin") && (
              <Link 
                to="/analytics" 
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                Analytics
              </Link>
            )}
            <Link 
              to="/profile" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              Profile
            </Link>
            <Link 
              to="/settings" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              Settings
            </Link>
          </nav>

          <div className="p-4 border-t border-gray-200">
            <Button variant="outline" className="w-full justify-center" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
