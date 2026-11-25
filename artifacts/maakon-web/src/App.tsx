import { lazy, Suspense, useLayoutEffect } from "react"; // suspense is used as a fallback while lazy-loaded components are being downloaded
import { Redirect, Switch, Route, Router as WouterRouter, useRoute } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { I18nextProvider } from "react-i18next";
import { createInstance } from "i18next";
import AuthModal from "@/components/auth/AuthModal";

// Initialize i18n
import i18n from "@/lib/i18n"; // we import this file to initialize i18n before rendering the app. This is necessary to ensure that the translations are available when the app is rendered.

// Route pages are lazy-loaded so the first visit only downloads the Home page.
// Each page (and its heavy dependencies, e.g. Leaflet for the map) becomes its own chunk.
const MapPage = lazy(() => import("@/pages/MapPage"));
const PostNeed = lazy(() => import("@/pages/PostNeed"));
const PostOffer = lazy(() => import("@/pages/PostOffer"));
const GiveReferral = lazy(() => import("@/pages/GiveReferral"));
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

function OfferRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <PageFallback />;
  return user?.accountType === "ngo" ? <PostOffer /> : <Redirect to="/give" replace />;
}

function NeedRoute() {
  const { user, isLoading } = useAuth();
  return isLoading ? <PageFallback /> : <PostNeed key={user?.id ?? "guest"} />;
}

function Router() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/map" component={MapPage} />
        <Route path="/need/new" component={NeedRoute} />
        <Route path="/offer/new" component={OfferRoute} />
        <Route path="/give" component={GiveReferral} />
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

// Keep the console and its portaled controls in English without changing the
// language preference used by the public site.
const consoleLanguage = createInstance();
void consoleLanguage.init({
  lng: "en",
  resources: {
    en: { translation: i18n.getResourceBundle("en", "translation") },
  },
  initAsync: false,
  interpolation: { escapeValue: false },
});
function ApplicationRoutes() {
  const [admin] = useRoute("/admin");
  useLayoutEffect(() => {
    if (!admin) return;
    document.documentElement.dir = "ltr";
    document.documentElement.lang = "en";
    return () => {
      document.documentElement.dir = i18n.dir();
      document.documentElement.lang = i18n.language;
    };
  }, [admin]);
  return (
    <I18nextProvider i18n={admin ? consoleLanguage : i18n}>
      {/* Global popup for authentication (login/logout) */}
      <AuthModal />
      <Router />
      {/* Global notification system for user feedback */}
      <Toaster />
    </I18nextProvider>
  );
}

function App() {
  return (
    // Data layer for managing API requests and caching
    <QueryClientProvider client={queryClient}>
      {/* User session, permission, login/logout */}
      <AuthProvider>
        {/* UI coordination */}
        <TooltipProvider>
          {/* Router (URL-matching & page display) */}
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <ApplicationRoutes />
          </WouterRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
