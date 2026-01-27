import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

// Lazy load route components for code splitting
const Editor = lazy(() => import("./pages/Editor"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Home = lazy(() => import("./pages/Home"));
const Catalog = lazy(() => import("./pages/Catalog"));
const CourseSettings = lazy(() => import("./pages/CourseSettings"));
const CourseStats = lazy(() => import("./pages/CourseStats"));
const PublicCourse = lazy(() => import("./pages/PublicCourse"));
const ShortCourse = lazy(() => import("./pages/ShortCourse"));
const Moderation = lazy(() => import("./pages/Moderation"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
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
    return <PageLoader />;
  }

  if (user) {
    return <Navigate to="/workshop" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => (
  <Suspense fallback={<PageLoader />}>
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
      <Route path="/c/:shortId" element={<ShortCourse />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
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
