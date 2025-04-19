
import { Link } from "react-router-dom";
import { HelpCircle, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navigation } from "./Navigation";
import { NotificationsMenu } from "./NotificationsMenu";
import { UserMenu } from "./UserMenu";
import { MobileMenu } from "./MobileMenu";

const Header = () => {
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
          <Navigation />

          {/* Right side user menu and notifications */}
          <div className="flex items-center">
            {/* Help */}
            <Button variant="ghost" size="icon" className="mr-2">
              <HelpCircle className="h-5 w-5 text-gray-600" />
            </Button>

            {/* Notifications */}
            <NotificationsMenu />

            {/* User menu (desktop) */}
            <UserMenu />

            {/* Mobile menu */}
            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
