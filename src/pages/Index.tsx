import { ServiceOrderSummary } from "@/components/dashboard/ServiceOrderSummary";
import { FinancialSummary } from "@/components/dashboard/FinancialSummary";
import { SalesSummary } from "@/components/dashboard/SalesSummary";
import { POSSalesSummary } from "@/components/dashboard/POSSalesSummary";
import { SalesOverviewWidget } from "@/components/dashboard/SalesOverviewWidget";
import { WarrantyOverviewWidget } from "@/components/dashboard/WarrantyOverviewWidget"; // New import
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Olá, bem-vindo(a) de volta!</h1>
          <p className="text-muted-foreground">
            Aqui está um resumo rápido do seu negócio hoje.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => navigate('/new-service-order')}>
            <PlusCircle className="h-4 w-4 mr-2" /> Nova Ordem de Serviço
          </Button>
        </div>
      </div>
      <div className="space-y-8">
        <FinancialSummary />
        <h2 className="text-2xl font-semibold tracking-tight mb-4">Resumo de Vendas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SalesSummary />
          <POSSalesSummary />
          <SalesOverviewWidget />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight mb-4">Garantias e Serviços</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <WarrantyOverviewWidget /> {/* Integrated new widget */}
          {/* Placeholder for Service Analytics Widget */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <Card className="h-full">
              <CardHeader><CardTitle>Serviços Mais Comuns</CardTitle></CardHeader>
              <CardContent className="flex justify-center items-center h-48 text-muted-foreground">
                Em breve...
              </CardContent>
            </Card>
          </div>
          {/* Placeholder for Average Ticket Widget */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <Card className="h-full">
              <CardHeader><CardTitle>Ticket Médio de Clientes</CardTitle></CardHeader>
              <CardContent className="flex justify-center items-center h-48 text-muted-foreground">
                Em breve...
              </CardContent>
            </Card>
          </div>
        </div>
        <ServiceOrderSummary />
      </div>
      <div className="mt-auto pt-8">
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default Index;