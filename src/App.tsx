import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Editor from "./pages/Editor";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import CourseSettings from "./pages/CourseSettings";
import CourseStats from "./pages/CourseStats";
import PublicCourse from "./pages/PublicCourse";
import Moderation from "./pages/Moderation";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

// Public route wrapper (redirect to dashboard if logged in)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/workshop" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
    <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
    <Route path="/catalog" element={<ProtectedRoute><Catalog /></ProtectedRoute>} />
    <Route path="/workshop" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/editor/:courseId" element={<ProtectedRoute><Editor /></ProtectedRoute>} />
    <Route path="/course/:courseId/settings" element={<ProtectedRoute><CourseSettings /></ProtectedRoute>} />
    <Route path="/course/:courseId/stats" element={<ProtectedRoute><CourseStats /></ProtectedRoute>} />
    <Route path="/moderation" element={<ProtectedRoute><Moderation /></ProtectedRoute>} />
    <Route path="/course/:courseId" element={<PublicCourse />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
