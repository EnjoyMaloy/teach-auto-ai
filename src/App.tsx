import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { LanguageProvider } from "@/hooks/useLanguage";
import { Loader2 } from "lucide-react";
import ProtectedLayout from "@/components/layout/ProtectedLayout";

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
const Dictionary = lazy(() => import("./pages/Dictionary"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Pricing = lazy(() => import("./pages/Pricing"));
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
  <div ref={ref} className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
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
      <Route path="/" element={<Suspense fallback={<PageLoader />}><Home /></Suspense>} />
      <Route path="/catalog" element={<Suspense fallback={<PageLoader />}><Catalog /></Suspense>} />
      <Route path="/workshop" element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
      <Route path="/moderation" element={<Suspense fallback={<PageLoader />}><Moderation /></Suspense>} />
      <Route path="/dictionary" element={<Suspense fallback={<PageLoader />}><Dictionary /></Suspense>} />
      <Route path="/favorites" element={<Suspense fallback={<PageLoader />}><Favorites /></Suspense>} />
      <Route path="/pricing" element={<Suspense fallback={<PageLoader />}><Pricing /></Suspense>} />
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
            <LanguageProvider>
              <AppRoutes />
            </LanguageProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
