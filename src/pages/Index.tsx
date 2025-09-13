import { ServiceOrderSummary } from "@/components/dashboard/ServiceOrderSummary";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen p-4 sm:p-0">
      <div className="flex-grow">
        <Card className="w-full mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-3xl">Dashboard</CardTitle>
            <Button onClick={() => navigate('/new-service-order')}>
              <PlusCircle className="h-4 w-4 mr-2" /> Nova Ordem de Serviço
            </Button>
          </CardHeader>
          <CardContent>
            <ServiceOrderSummary />
          </CardContent>
        </Card>
        {/* Aqui você pode adicionar mais widgets ao dashboard no futuro */}
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;