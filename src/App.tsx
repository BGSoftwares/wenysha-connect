import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import React, { Suspense, lazy } from "react";

// Lazy loaded components for optimized performance
const Index = lazy(() => import("./pages/Index"));
const Portal = lazy(() => import("./pages/Portal"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const TeacherDashboard = lazy(() => import("./pages/TeacherDashboard"));
const AccountsDashboard = lazy(() => import("./pages/AccountsDashboard"));
const SignUp = lazy(() => import("./pages/SignUp"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ProtectedRoute = lazy(() => import("./components/ProtectedRoute"));
const About = lazy(() => import("./pages/About"));
const Academics = lazy(() => import("./pages/Academics"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Announcements = lazy(() => import("./pages/Announcements"));
const Contact = lazy(() => import("./pages/Contact"));
const Library = lazy(() => import("./pages/Library"));
const ParentPortal = lazy(() => import("./pages/ParentPortal"));
const Auth = lazy(() => import("./pages/Auth"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));

// Loading Component
const PageLoader = () => (
  <div className="h-screen w-full flex flex-col items-center justify-center bg-forest relative overflow-hidden">
    <div className="absolute inset-0 bg-noise pointer-events-none opacity-20" />
    <div className="relative z-10 flex flex-col items-center gap-6">
      <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-accent to-gold-dark p-[2px] animate-float shadow-2xl shadow-accent/20">
        <div className="h-full w-full rounded-[14px] bg-forest flex items-center justify-center border border-white/10">
          <div className="h-10 w-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <h2 className="font-heading font-black text-2xl text-white tracking-widest">WENYASHA</h2>
        <div className="flex gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as any).status;
          if (status >= 400 && status < 500) return false;
        }
        // Retry up to 3 times for network errors and 5xx errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry mutations on client errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as any).status;
          if (status >= 400 && status < 500) return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/portal" element={<Portal />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/admin/:id/*" element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/*" element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } />

              <Route path="/student/:id/*" element={
                <ProtectedRoute>
                  <StudentDashboard />
                </ProtectedRoute>
              } />
              <Route path="/student/*" element={
                <ProtectedRoute>
                  <StudentDashboard />
                </ProtectedRoute>
              } />

              <Route path="/teacher/:id/*" element={
                <ProtectedRoute>
                  <TeacherDashboard />
                </ProtectedRoute>
              } />
              <Route path="/teacher/*" element={
                <ProtectedRoute>
                  <TeacherDashboard />
                </ProtectedRoute>
              } />

              <Route path="/accounts/:id/*" element={
                <ProtectedRoute allowedRoles={["accounts", "admin"]}>
                  <AccountsDashboard />
                </ProtectedRoute>
              } />
              <Route path="/accounts/*" element={
                <ProtectedRoute allowedRoles={["accounts", "admin"]}>
                  <AccountsDashboard />
                </ProtectedRoute>
              } />
              <Route path="/parent/:id/*" element={<ParentPortal />} />
              <Route path="/parent/*" element={<ParentPortal />} />
              <Route path="/about" element={<About />} />
              <Route path="/academics" element={<Academics />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/library" element={<Library />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
