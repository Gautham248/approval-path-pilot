
import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

const UnauthorizedPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-md mx-auto">
        <ShieldAlert className="h-16 w-16 text-red-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          You don't have permission to access this page. Please contact your
          administrator if you believe this is an error.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link to="/">Go to Dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/login">Sign in with a different account</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
