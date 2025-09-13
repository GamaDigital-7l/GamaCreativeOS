import { ServiceOrderList } from "@/components/service-orders/ServiceOrderList";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ServiceOrdersPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-6xl">
        <ServiceOrderList />
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default ServiceOrdersPage;