import { DeviceDetail } from "@/components/devices/DeviceDetail";

const DeviceDetailPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-primary/10 p-4 sm:p-6">
      <DeviceDetail />
    </div>
  );
};

export default DeviceDetailPage;