import { DeviceDetail } from "@/components/devices/DeviceDetail";
import { MadeWithDyad } from "@/components/made-with-dyad";

const DeviceDetailPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <DeviceDetail />
      <MadeWithDyad />
    </div>
  );
};

export default DeviceDetailPage;