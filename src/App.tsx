import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import NewServiceOrderPage from "./pages/NewServiceOrderPage";
import ServiceOrdersPage from "./pages/ServiceOrdersPage";
import ServiceOrderDetailPage from "./pages/ServiceOrderDetailPage";
import EditServiceOrderPage from "./pages/EditServiceOrderPage";
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
import PrintServiceOrderLabelPage from "./pages/PrintServiceOrderLabelPage";
import PrintableServiceOrderWarrantyPage from "./pages/PrintableServiceOrderWarrantyPage";
import PhotoUploadPage from "./pages/PhotoUploadPage";
import SuppliersPage from "./pages/SuppliersPage";
import NewSupplierPage from "./pages/NewSupplierPage";
import SupplierDetailPage from "./pages/SupplierDetailPage";
import EditSupplierPage from "./pages/EditSupplierPage";
import SalesPage from "./pages/SalesPage";
import NewSalePage from "./pages/NewSalePage";
import SaleDetailPage from "./pages/SaleDetailPage";
import EditSalePage from "./pages/EditSalePage";
import PointOfSalePage from "./pages/PointOfSalePage";
import QuoteApprovalPage from "./pages/QuoteApprovalPage";
import FinancialsPage from "./pages/FinancialsPage";
import GamificationPage from "./pages/GamificationPage";
import ManageGamificationPage from "./pages/ManageGamificationPage";
import OnlineCatalogPage from "./pages/OnlineCatalogPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import PublicCatalogPage from "./pages/PublicCatalogPage";
import ManageCustomFieldsPage from "./pages/ManageCustomFieldsPage";
import POSSalesListPage from "./pages/POSSalesListPage"; // New import
import { SessionContextProvider } from "./integrations/supabase/SessionContext";
import { Layout } from "./components/layout/Layout";
import PrintableSaleReceiptPage from "./pages/PrintableSaleReceiptPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionContextProvider>
          <Routes>
            {/* Rotas públicas (sem menu lateral/login) */}
            <Route path="/login" element={<Login />} />
            <Route path="/upload-photos/:id" element={<PhotoUploadPage />} />
            <Route path="/service-orders/:id/print" element={<PrintServiceOrderPage />} />
            <Route path="/service-orders/:id/print-label" element={<PrintServiceOrderLabelPage />} />
            <Route path="/service-orders/:id/print-warranty" element={<PrintableServiceOrderWarrantyPage />} />
            <Route path="/quote/:id" element={<QuoteApprovalPage />} />
            <Route path="/sales/:id/print" element={<PrintableSaleReceiptPage />} />
            
            {/* Rotas do Catálogo Online (públicas) */}
            <Route path="/public-catalog" element={<PublicCatalogPage />} />
            <Route path="/public-catalog/:itemIds" element={<PublicCatalogPage />} />
            <Route path="/catalog/item/:id" element={<ProductDetailPage />} /> {/* Detalhes do produto (público) */}

            {/* Rotas dentro do layout principal (com menu lateral) */}
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/service-orders" element={<ServiceOrdersPage />} />
              <Route path="/new-service-order" element={<NewServiceOrderPage />} />
              <Route path="/service-orders/:id" element={<ServiceOrderDetailPage />} />
              <Route path="/service-orders/:id/edit" element={<EditServiceOrderPage />} />
              <Route path="/sales" element={<SalesPage />} />
              <Route path="/sales/new" element={<NewSalePage />} />
              <Route path="/sales/:id" element={<SaleDetailPage />} />
              <Route path="/sales/:id/edit" element={<EditSalePage />} />
              <Route path="/pos" element={<PointOfSalePage />} />
              <Route path="/pos/history" element={<POSSalesListPage />} /> {/* New route */}
              <Route path="/financials" element={<FinancialsPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/new-customer" element={<NewCustomerPage />} />
              <Route path="/customers/:id" element={<CustomerDetailPage />} />
              <Route path="/customers/:id/edit" element={<EditCustomerPage />} />
              <Route path="/devices" element={<DevicesPage />} />
              <Route path="/new-device" element={<NewDevicePage />} />
              <Route path="/devices/:id" element={<DeviceDetailPage />} />
              <Route path="/devices/:id/edit" element={<EditDevicePage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/inventory/new" element={<NewInventoryItemPage />} />
              <Route path="/inventory/:id" element={<InventoryItemDetailPage />} />
              <Route path="/inventory/:id/edit" element={<EditInventoryItemPage />} />
              <Route path="/suppliers" element={<SuppliersPage />} />
              <Route path="/suppliers/new" element={<NewSupplierPage />} />
              <Route path="/suppliers/:id" element={<SupplierDetailPage />} />
              <Route path="/suppliers/:id/edit" element={<EditSupplierPage />} />
              <Route path="/catalog" element={<OnlineCatalogPage />} />
              <Route path="/catalog/:itemIds" element={<OnlineCatalogPage />} />
              <Route path="/gamification" element={<GamificationPage />} />
              <Route path="/gamification/manage" element={<ManageGamificationPage />} />
              <Route path="/profile" element={<UserProfilePage />} />
              <Route path="/profile/edit" element={<EditUserProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/settings/custom-fields" element={<ManageCustomFieldsPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </SessionContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;