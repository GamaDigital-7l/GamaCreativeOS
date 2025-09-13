import { ServiceOrderDetail } from "@/components/service-orders/ServiceOrderDetail";
import { MadeWithDyad } from "@/components/made-with-dyad";

const ServiceOrderDetailPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <ServiceOrderDetail />
      <MadeWithDyad />
    </div>
  );
};

export default ServiceOrderDetailPage;