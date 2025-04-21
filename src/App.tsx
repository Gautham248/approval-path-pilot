
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { WorkflowProvider } from "@/context/WorkflowContext";

// Pages
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import NotFound from "./pages/NotFound";
import RequestsPage from "./pages/RequestsPage";
import NewRequestPage from "./pages/NewRequestPage";
import RequestDetailPage from "./pages/RequestDetailPage";
import RequestReviewPage from "./pages/RequestReviewPage";
import RequestEditPage from "./pages/RequestEditPage";
import ApprovalsPage from "./pages/ApprovalsPage";
import AnalyticsPage from "./pages/AnalyticsPage";

// Components
import AuthGuard from "./components/auth/AuthGuard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <WorkflowProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route path="/index" element={<Index />} />
              
              {/* Protected routes */}
              <Route path="/" element={
                <AuthGuard>
                  <DashboardPage />
                </AuthGuard>
              } />
              
              {/* Requests routes */}
              <Route path="/requests" element={
                <AuthGuard>
                  <RequestsPage />
                </AuthGuard>
              } />
              <Route path="/requests/new" element={
                <AuthGuard>
                  <NewRequestPage />
                </AuthGuard>
              } />
              <Route path="/requests/:id" element={
                <AuthGuard>
                  <RequestDetailPage />
                </AuthGuard>
              } />
              <Route path="/requests/:id/review" element={
                <AuthGuard>
                  <RequestReviewPage />
                </AuthGuard>
              } />
              <Route path="/requests/:id/edit" element={
                <AuthGuard>
                  <RequestEditPage />
                </AuthGuard>
              } />
              
              {/* Approvals & Analytics routes */}
              <Route path="/approvals" element={
                <AuthGuard>
                  <ApprovalsPage />
                </AuthGuard>
              } />
              <Route path="/analytics" element={
                <AuthGuard allowedRoles={["admin", "du_head"]}>
                  <AnalyticsPage />
                </AuthGuard>
              } />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </WorkflowProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
