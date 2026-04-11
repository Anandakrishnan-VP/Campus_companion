import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useKioskNotifications } from "@/hooks/use-kiosk-notifications";
import { TenantProvider } from "@/contexts/TenantContext";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Professor from "./pages/Professor";
import Issues from "./pages/Issues";
import Register from "./pages/Register";
import SuperAdmin from "./pages/SuperAdmin";
import SelectTenant from "./pages/SelectTenant";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import Subscribe from "./pages/Subscribe";
import NotFound from "./pages/NotFound";
import { useTenant } from "@/contexts/TenantContext";

const HomeRoute = () => {
  const { tenant, loading, isPlatformHome } = useTenant();
  if (loading) return null;
  if (isPlatformHome) return <Landing />;
  return <Index />;
};

const queryClient = new QueryClient();

const KioskNotificationProvider = ({ children }: { children: React.ReactNode }) => {
  useKioskNotifications();
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <TenantProvider>
          <KioskNotificationProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<HomeRoute />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/professor" element={<Professor />} />
              <Route path="/issues" element={<Issues />} />
              <Route path="/register" element={<Register />} />
              <Route path="/super-admin" element={<SuperAdmin />} />
              <Route path="/select-tenant" element={<SelectTenant />} />
              <Route path="/subscription/success" element={<SubscriptionSuccess />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </KioskNotificationProvider>
        </TenantProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
