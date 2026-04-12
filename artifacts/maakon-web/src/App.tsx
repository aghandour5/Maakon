import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import { AuthProvider } from "@/contexts/AuthContext";
import MapPage from "@/pages/MapPage";
import PostNeed from "@/pages/PostNeed";
import PostOffer from "@/pages/PostOffer";
import AuthModal from "@/components/auth/AuthModal";
import AdminPage from "@/pages/AdminPage";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import MyPosts from "@/pages/MyPosts";
import Support from "@/pages/Support";
import AuthCallback from "@/pages/auth/AuthCallback";

// Initialize i18n
import "@/lib/i18n"; // we import this file to initialize i18n before rendering the app. This is necessary to ensure that the translations are available when the app is rendered.

const queryClient = new QueryClient({ // we use queryClient to fetch data from the API and cache it. We can configure it to not retry failed requests and not refetch on window focus.
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    }
  }
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/map" component={MapPage} />
      <Route path="/need/new" component={PostNeed} />
      <Route path="/offer/new" component={PostOffer} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/my-posts" component={MyPosts} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/support" component={Support} />
      <Route component={NotFound} />
    </Switch>
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
