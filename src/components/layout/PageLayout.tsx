
import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  fullWidth?: boolean;
}

const PageLayout = ({ 
  children, 
  title, 
  subtitle, 
  fullWidth = false 
}: PageLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1">
        {/* Page header with title */}
        {(title || subtitle) && (
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className={`py-6 px-4 ${fullWidth ? 'mx-auto' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}`}>
              {title && <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>}
              {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
            </div>
          </div>
        )}
        
        {/* Page content */}
        <div className={`${fullWidth ? 'w-full' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'} py-6`}>
          {children}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PageLayout;
