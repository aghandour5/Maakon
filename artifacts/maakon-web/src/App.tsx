import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import { AuthProvider } from "@/contexts/AuthContext";
import AuthModal from "@/components/auth/AuthModal";

// Initialize i18n
import "@/lib/i18n"; // we import this file to initialize i18n before rendering the app. This is necessary to ensure that the translations are available when the app is rendered.

// Route pages are lazy-loaded so the first visit only downloads the Home page.
// Each page (and its heavy dependencies, e.g. Leaflet for the map) becomes its own chunk.
const MapPage = lazy(() => import("@/pages/MapPage"));
const PostNeed = lazy(() => import("@/pages/PostNeed"));
const PostOffer = lazy(() => import("@/pages/PostOffer"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));
const MyPosts = lazy(() => import("@/pages/MyPosts"));
const About = lazy(() => import("@/pages/About"));
const Contact = lazy(() => import("@/pages/Contact"));
const FAQ = lazy(() => import("@/pages/FAQ"));
const Support = lazy(() => import("@/pages/Support"));
const AuthCallback = lazy(() => import("@/pages/auth/AuthCallback"));
const NotFound = lazy(() => import("@/pages/not-found"));

const queryClient = new QueryClient({ // we use queryClient to fetch data from the API and cache it. We can configure it to not retry failed requests and not refetch on window focus.
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    }
  }
});

// Shown briefly while a lazy-loaded page chunk is being downloaded.
function PageFallback() {
  return (
    <div className="min-h-dvh flex items-center justify-center" role="status" aria-live="polite">
      <span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/map" component={MapPage} />
        <Route path="/need/new" component={PostNeed} />
        <Route path="/offer/new" component={PostOffer} />
        <Route path="/auth/callback" component={AuthCallback} />
        <Route path="/my-posts" component={MyPosts} />
        <Route path="/admin" component={AdminPage} />
        <Route path="/about" component={About} />
        <Route path="/faq" component={FAQ} />
        <Route path="/contact" component={Contact} />
        <Route path="/support" component={Support} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <AuthModal />
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
