import { SaleDetail } from "@/components/sales/SaleDetail";
import { GamaCreative } from "@/components/gama-creative";

const SaleDetailPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-primary/10 p-4 sm:p-6">
      <SaleDetail />
      <GamaCreative />
    </div>
  );
};

export default SaleDetailPage;