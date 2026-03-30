import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Farms from "./pages/Farms";
import Plants from "./pages/Plants";
import Sensors from "./pages/Sensors";
import AccountSettings from "./pages/AccountSettings";
import NotFound from "./pages/NotFound";
import Subscriptions from "./pages/Subscriptions";
import Checkout from "./pages/Checkout";

const queryClient = new QueryClient();

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  if (loading) return <div className="min-h-screen flex items-center justify-center">{t("common.loading")}</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/subscriptions" element={<Subscriptions />} />
      <Route
        path="/checkout"
        element={
          <RequireAuth>
            <Checkout />
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/farms"
        element={
          <RequireAuth>
            <Farms />
          </RequireAuth>
        }
      />
      <Route
        path="/plants"
        element={
          <RequireAuth>
            <Plants />
          </RequireAuth>
        }
      />
      <Route
        path="/sensors"
        element={
          <RequireAuth>
            <Sensors />
          </RequireAuth>
        }
      />
      <Route
        path="/settings"
        element={
          <RequireAuth>
            <AccountSettings />
          </RequireAuth>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
