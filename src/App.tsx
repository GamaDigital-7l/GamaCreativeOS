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
import UserProfilePage from "./pages/UserProfilePage";
import EditUserProfilePage from "./pages/EditUserProfilePage";
import InventoryPage from "./pages/InventoryPage";
import NewInventoryItemPage from "./pages/NewInventoryItemPage";
import InventoryItemDetailPage from "./pages/InventoryItemDetailPage";
import EditInventoryItemPage from "./pages/EditInventoryItemPage";
import SettingsPage from "./pages/SettingsPage";
import PrintServiceOrderPage from "./pages/PrintServiceOrderPage";
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
            <Route path="/service-orders/:id/print" element={<PrintServiceOrderPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/new-customer" element={<NewCustomerPage />} />
            <Route path="/customers/:id" element={<CustomerDetailPage />} />
            <Route path="/customers/:id/edit" element={<EditCustomerPage />} />
            <Route path="/devices" element={<DevicesPage />} />
            <Route path="/new-device" element={<NewDevicePage />} />
            <Route path="/devices/:id" element={<DeviceDetailPage />} />
            <Route path="/devices/:id/edit" element={<EditDevicePage />} />
            <Route path="/profile" element={<UserProfilePage />} />
            <Route path="/profile/edit" element={<EditUserProfilePage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/inventory/new" element={<NewInventoryItemPage />} />
            <Route path="/inventory/:id" element={<InventoryItemDetailPage />} />
            <Route path="/inventory/:id/edit" element={<EditInventoryItemPage />} />
            <Route path="/settings" element={<SettingsPage />} />
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