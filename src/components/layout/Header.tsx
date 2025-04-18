
import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Bell, 
  User, 
  Menu, 
  X, 
  LogOut, 
  Settings, 
  ChevronDown,
  Plane,
  HelpCircle
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { getInitials, getRoleLabel } from "@/lib/utils/formatters";

const Header = () => {
  const { currentUser, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and site name */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <Plane className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-semibold text-gray-900">TravelFlow</span>
            </Link>
          </div>

          {/* Desktop navigation */}
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

          {/* Right side user menu and notifications */}
          <div className="flex items-center">
            {/* Help */}
            <Button variant="ghost" size="icon" className="mr-2">
              <HelpCircle className="h-5 w-5 text-gray-600" />
            </Button>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative mr-2">
                  <Bell className="h-5 w-5 text-gray-600" />
                  <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5">3</Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-64 overflow-y-auto">
                  <DropdownMenuItem className="p-3 cursor-default">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">Request #123 needs your approval</span>
                      <span className="text-sm text-gray-500">2 minutes ago</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="p-3 cursor-default">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">Your request #456 was approved</span>
                      <span className="text-sm text-gray-500">1 hour ago</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="p-3 cursor-default">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">Admin added ticket options to request #789</span>
                      <span className="text-sm text-gray-500">3 hours ago</span>
                    </div>
                  </DropdownMenuItem>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="justify-center">
                  <Link to="/notifications" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                    View all notifications
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User menu (desktop) */}
            {currentUser && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 hover:bg-gray-100 hidden md:flex">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={currentUser.avatar} />
                      <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-sm">
                      <span className="font-medium">{currentUser.name}</span>
                      <span className="text-xs text-gray-500">{getRoleLabel(currentUser.role)}</span>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <Link to="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <Link to="/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Mobile menu button */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 p-0">
                <div className="flex flex-col h-full">
                  {/* Mobile menu header */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <span className="text-lg font-semibold">Menu</span>
                    <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Mobile user info */}
                  {currentUser && (
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
                  )}

                  {/* Mobile navigation links */}
                  <nav className="flex-1 px-2 py-4 bg-white space-y-1">
                    <Link 
                      to="/" 
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link 
                      to="/requests" 
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Requests
                    </Link>
                    {currentUser?.role === "admin" && (
                      <Link 
                        to="/admin" 
                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Admin
                      </Link>
                    )}
                    <Link 
                      to="/analytics" 
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Analytics
                    </Link>
                    <Link 
                      to="/profile" 
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link 
                      to="/settings" 
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Settings
                    </Link>
                  </nav>

                  {/* Mobile footer actions */}
                  <div className="p-4 border-t border-gray-200">
                    <Button variant="outline" className="w-full justify-center" onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
