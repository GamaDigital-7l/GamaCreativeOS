import { DeviceDetail } from "@/components/devices/DeviceDetail";
import { GamaCreative } from "@/components/gama-creative";

const DeviceDetailPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-primary/10 p-4 sm:p-6">
      <DeviceDetail />
      <GamaCreative />
    </div>
  );
};

export default DeviceDetailPage;