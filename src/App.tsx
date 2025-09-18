import React, { lazy, Suspense } from "react"; // Importar lazy e Suspense
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import PhotoUploadPage from "./pages/PhotoUploadPage";
import QuoteApprovalPage from "./pages/QuoteApprovalPage";
import PublicCatalogPage from "./pages/PublicCatalogPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import { SessionContextProvider } from "./integrations/supabase/SessionContext";
import { Layout } from "./components/layout/Layout";
import { ThemeProvider } from "./components/theme-provider"; // Importar ThemeProvider

// Lazy-loaded pages
const Index = lazy(() => import("./pages/Index"));
const NewServiceOrderPage = lazy(() => import("./pages/NewServiceOrderPage"));
const ServiceOrdersPage = lazy(() => import("./pages/ServiceOrdersPage"));
const ServiceOrderDetailPage = lazy(() => import("./pages/ServiceOrderDetailPage"));
const EditServiceOrderPage = lazy(() => import("./pages/EditServiceOrderPage"));
const CustomersPage = lazy(() => import("./pages/CustomersPage"));
const NewCustomerPage = lazy(() => import("./pages/NewCustomerPage"));
const CustomerDetailPage = lazy(() => import("./pages/CustomerDetailPage"));
const EditCustomerPage = lazy(() => import("./pages/EditCustomerPage"));
const DevicesPage = lazy(() => import("./pages/DevicesPage"));
const NewDevicePage = lazy(() => import("./pages/NewDevicePage"));
const DeviceDetailPage = lazy(() => import("./pages/DeviceDetailPage"));
const EditDevicePage = lazy(() => import("./pages/EditDevicePage"));
const UserProfilePage = lazy(() => import("./pages/UserProfilePage"));
const EditUserProfilePage = lazy(() => import("./pages/EditUserProfilePage"));
const InventoryPage = lazy(() => import("./pages/InventoryPage"));
const NewInventoryItemPage = lazy(() => import("./pages/NewInventoryItemPage"));
const InventoryItemDetailPage = lazy(() => import("./pages/InventoryItemDetailPage"));
const EditInventoryItemPage = lazy(() => import("./pages/EditInventoryItemPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const PrintServiceOrderPage = lazy(() => import("./pages/PrintServiceOrderPage"));
const PrintServiceOrderLabelPage = lazy(() => import("./pages/PrintServiceOrderLabelPage"));
const PrintableServiceOrderWarrantyPage = lazy(() => import("./pages/PrintableServiceOrderWarrantyPage"));
const SuppliersPage = lazy(() => import("./pages/SuppliersPage"));
const NewSupplierPage = lazy(() => import("./pages/NewSupplierPage"));
const SupplierDetailPage = lazy(() => import("./pages/SupplierDetailPage"));
const EditSupplierPage = lazy(() => import("./pages/EditSupplierPage"));
const SalesPage = lazy(() => import("./pages/SalesPage"));
const NewSalePage = lazy(() => import("./pages/NewSalePage"));
const SaleDetailPage = lazy(() => import("./pages/SaleDetailPage"));
const EditSalePage = lazy(() => import("./pages/EditSalePage"));
const PointOfSalePage = lazy(() => import("./pages/PointOfSalePage"));
const FinancialsPage = lazy(() => import("./pages/FinancialsPage"));
const GamificationPage = lazy(() => import("./pages/GamificationPage"));
const ManageGamificationPage = lazy(() => import("./pages/ManageGamificationPage"));
const OnlineCatalogPage = lazy(() => import("./pages/OnlineCatalogPage"));
const ManageCustomFieldsPage = lazy(() => import("./pages/ManageCustomFieldsPage"));
const POSSalesListPage = lazy(() => import("./pages/POSSalesListPage"));
const POSSaleDetailPage = lazy(() => import("./pages/POSSaleDetailPage"));
const PurchaseRequestsPage = lazy(() => import("./pages/PurchaseRequestsPage"));
const PrintableSaleReceiptPage = lazy(() => import("./pages/PrintableSaleReceiptPage"));
const PrintSaleReceiptOptionsPage = lazy(() => import("./pages/PrintSaleReceiptOptionsPage"));
const PrintPOSReceiptOptionsPage = lazy(() => import("./pages/PrintPOSReceiptOptionsPage"));
const ImportServiceOrdersPage = lazy(() => import("./pages/ImportServiceOrdersPage"));


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme" attribute="class"> {/* Adicionado ThemeProvider e attribute="class" */}
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
              <Route path="/sales/:id/print-options" element={<PrintSaleReceiptOptionsPage />} />
              <Route path="/pos-sales/:id/print-options" element={<PrintPOSReceiptOptionsPage />} />
              
              {/* Rotas do Catálogo Online (públicas) */}
              <Route path="/public-catalog" element={<PublicCatalogPage />} />
              <Route path="/public-catalog/:itemIds" element={<PublicCatalogPage />} />
              <Route path="/catalog/item/:id" element={<ProductDetailPage />} /> {/* Detalhes do produto (público) */}

              {/* Rotas dentro do layout principal (com menu lateral) */}
              <Route element={<Layout />}>
                <Route 
                  path="*" 
                  element={
                    <Suspense fallback={<div className="flex h-screen items-center justify-center text-primary text-xl">Carregando...</div>}>
                      <Routes>
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
                        <Route path="/pos/history" element={<POSSalesListPage />} />
                        <Route path="/pos-sales/:id" element={<POSSaleDetailPage />} />
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
                        <Route path="/purchase-requests" element={<PurchaseRequestsPage />} />
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
                        <Route path="/import-service-orders" element={<ImportServiceOrdersPage />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  }
                />
              </Route>
            </Routes>
          </SessionContextProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider> {/* Fechado ThemeProvider */}
  </QueryClientProvider>
);

export default App;