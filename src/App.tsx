import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import NewServiceOrderPage from "./pages/NewServiceOrder";
import ServiceOrdersPage from "./pages/ServiceOrdersPage";
import ServiceOrderDetailPage from "./pages/ServiceOrderDetailPage";
import EditServiceOrderPage from "./pages/EditServiceOrderPage";
import DashboardPage from "./pages/DashboardPage";
import CustomersPage from "./pages/CustomersPage";
import NewCustomerPage from "./pages/NewCustomerPage";
import CustomerDetailPage from "./pages/CustomerDetailPage";
import EditCustomerPage from "./pages/EditCustomerPage";
import DevicesPage from "./pages/DevicesPage";
import NewDevicePage from "./pages/NewDevicePage";
import DeviceDetailPage from "./pages/DeviceDetailPage";
import EditDevicePage from "./pages/EditDevicePage";
import UserProfilePage from "./pages/UserProfilePage"; // Import the new UserProfilePage
import { SessionContextProvider } from "./integrations/supabase/SessionContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionContextProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/new-service-order" element={<NewServiceOrderPage />} />
            <Route path="/service-orders" element={<ServiceOrdersPage />} />
            <Route path="/service-orders/:id" element={<ServiceOrderDetailPage />} />
            <Route path="/service-orders/:id/edit" element={<EditServiceOrderPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/new-customer" element={<NewCustomerPage />} />
            <Route path="/customers/:id" element={<CustomerDetailPage />} />
            <Route path="/customers/:id/edit" element={<EditCustomerPage />} />
            <Route path="/devices" element={<DevicesPage />} />
            <Route path="/new-device" element={<NewDevicePage />} />
            <Route path="/devices/:id" element={<DeviceDetailPage />} />
            <Route path="/devices/:id/edit" element={<EditDevicePage />} />
            <Route path="/profile" element={<UserProfilePage />} /> {/* Add user profile route */}
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SessionContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;