import { SupplierDetail } from "@/components/suppliers/SupplierDetail";
import { GamaCreative } from "@/components/gama-creative";

const SupplierDetailPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-primary/10 p-4 sm:p-6">
      <SupplierDetail />
      <GamaCreative />
    </div>
  );
};

export default SupplierDetailPage;