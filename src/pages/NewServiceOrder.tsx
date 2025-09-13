import { ServiceOrderForm } from "@/components/service-orders/ServiceOrderForm";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const NewServiceOrderPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-3xl text-center">Nova Ordem de Serviço</CardTitle>
        </CardHeader>
        <CardContent>
          <ServiceOrderForm />
        </CardContent>
      </Card>
      <MadeWithDyad />
    </div>
  );
};

export default NewServiceOrderPage;