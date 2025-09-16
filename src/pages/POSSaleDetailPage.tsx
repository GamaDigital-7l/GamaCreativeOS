import { POSSaleDetail } from "@/components/pos/POSSaleDetail";
import { GamaCreative } from "@/components/gama-creative";

const POSSaleDetailPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-primary/10 p-4 sm:p-6">
      <POSSaleDetail />
      <GamaCreative />
    </div>
  );
};

export default POSSaleDetailPage;