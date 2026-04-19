import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Profile from "@/pages/profile";
import PostDetail from "@/pages/post-detail";
import Search from "@/pages/search";
import Settings from "@/pages/settings";
import Admin from "@/pages/admin";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.status === 401 || error?.status === 403) return false;
        return failureCount < 2;
      },
    },
  },
});

function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType; adminOnly?: boolean }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
    if (!isLoading && user && adminOnly && user.role !== "admin") {
      setLocation("/");
    }
  }, [user, isLoading, adminOnly, setLocation]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;
  if (adminOnly && user.role !== "admin") return null;

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      <Route path="/">
        <Layout>
          <ProtectedRoute component={Home} />
        </Layout>
      </Route>

      <Route path="/profile/:username">
        <Layout>
          <ProtectedRoute component={Profile} />
        </Layout>
      </Route>

      <Route path="/post/:id">
        <Layout>
          <ProtectedRoute component={PostDetail} />
        </Layout>
      </Route>

      <Route path="/search">
        <Layout>
          <ProtectedRoute component={Search} />
        </Layout>
      </Route>

      <Route path="/settings">
        <Layout>
          <ProtectedRoute component={Settings} />
        </Layout>
      </Route>

      <Route path="/admin">
        <Layout>
          <ProtectedRoute component={Admin} adminOnly />
        </Layout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
