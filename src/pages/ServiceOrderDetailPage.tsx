import { ServiceOrderDetail } from "@/components/service-orders/ServiceOrderDetail";

const ServiceOrderDetailPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-primary/10 p-4 sm:p-6">
      <ServiceOrderDetail />
    </div>
  );
};

export default ServiceOrderDetailPage;