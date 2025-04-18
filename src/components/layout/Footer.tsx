
import { Link } from "react-router-dom";
import { Plane } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-gray-200 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <Plane className="h-6 w-6 text-blue-600" />
            <span className="ml-2 text-lg font-medium text-gray-900">TravelFlow</span>
          </div>
          
          <nav className="flex flex-wrap justify-center -mx-5 -my-2 mb-4 md:mb-0">
            <div className="px-5 py-2">
              <Link to="/" className="text-base text-gray-600 hover:text-blue-600">
                Home
              </Link>
            </div>
            <div className="px-5 py-2">
              <Link to="/about" className="text-base text-gray-600 hover:text-blue-600">
                About
              </Link>
            </div>
            <div className="px-5 py-2">
              <Link to="/help" className="text-base text-gray-600 hover:text-blue-600">
                Help
              </Link>
            </div>
            <div className="px-5 py-2">
              <Link to="/privacy" className="text-base text-gray-600 hover:text-blue-600">
                Privacy
              </Link>
            </div>
          </nav>
          
          <div className="text-center md:text-right">
            <p className="text-base text-gray-500">
              &copy; {currentYear} TravelFlow. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
