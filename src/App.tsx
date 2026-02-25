import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AIGenerationProvider } from "@/hooks/useAIGeneration";
import { LanguageProvider } from "@/hooks/useLanguage";
import { Loader2 } from "lucide-react";
import ProtectedLayout from "@/components/layout/ProtectedLayout";

// Direct imports for main nav pages (fast switching)
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Catalog from "./pages/Catalog";
import Favorites from "./pages/Favorites";
import Pricing from "./pages/Pricing";

// Lazy load heavy/rare pages only
const Editor = lazy(() => import("./pages/Editor"));
const Auth = lazy(() => import("./pages/Auth"));
const CourseSettings = lazy(() => import("./pages/CourseSettings"));
const CourseStats = lazy(() => import("./pages/CourseStats"));
const PublicCourse = lazy(() => import("./pages/PublicCourse"));
const ShortCourse = lazy(() => import("./pages/ShortCourse"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Loading fallback component - using forwardRef to avoid ref warnings in Suspense
import { forwardRef } from "react";

const PageLoader = forwardRef<HTMLDivElement>((_, ref) => (
  <div ref={ref} className="min-h-screen" />
));
PageLoader.displayName = "PageLoader";

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
  <Routes>
    <Route path="/auth" element={<PublicRoute><Suspense fallback={<PageLoader />}><Auth /></Suspense></PublicRoute>} />
    
    {/* Protected routes with persistent layout */}
    <Route element={<ProtectedRoute><ProtectedLayout /></ProtectedRoute>}>
      <Route path="/" element={<Home />} />
      <Route path="/catalog" element={<Catalog />} />
      <Route path="/workshop" element={<Dashboard />} />
      <Route path="/favorites" element={<Favorites />} />
      <Route path="/pricing" element={<Pricing />} />
    </Route>
    
    {/* Protected routes without sidebar layout */}
    <Route path="/editor/:courseId" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><Editor /></Suspense></ProtectedRoute>} />
    <Route path="/course/:courseId/settings" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><CourseSettings /></Suspense></ProtectedRoute>} />
    <Route path="/course/:courseId/stats" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><CourseStats /></Suspense></ProtectedRoute>} />
    
    {/* Public routes */}
    <Route path="/course/:courseId" element={<Suspense fallback={<PageLoader />}><PublicCourse /></Suspense>} />
    <Route path="/c/:shortId" element={<Suspense fallback={<PageLoader />}><ShortCourse /></Suspense>} />
    <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFound /></Suspense>} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AIGenerationProvider>
              <LanguageProvider>
                <AppRoutes />
              </LanguageProvider>
            </AIGenerationProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
