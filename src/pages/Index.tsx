import { ServiceOrderSummary } from "@/components/dashboard/ServiceOrderSummary";
import { FinancialSummary } from "@/components/dashboard/FinancialSummary";
import { SalesSummary } from "@/components/dashboard/SalesSummary";
import { POSSalesSummary } from "@/components/dashboard/POSSalesSummary";
import { SalesOverviewWidget } from "@/components/dashboard/SalesOverviewWidget";
import { WarrantyOverviewWidget } from "@/components/dashboard/WarrantyOverviewWidget";
import { AverageTicketWidget } from "@/components/dashboard/AverageTicketWidget";
import { CommonServicesWidget } from "@/components/dashboard/CommonServicesWidget";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useSession } from "@/integrations/supabase/SessionContext"; // Importar useSession

// Componente de depuração temporário
const DebugUserRole = () => {
  const { user, isLoading } = useSession();
  if (isLoading) return <p>Carregando informações do usuário...</p>;
  if (!user) return <p>Nenhum usuário logado.</p>;
  return (
    <Card className="mt-4 p-4 bg-blue-100 border-blue-400 text-blue-800">
      <CardTitle className="text-lg">Informações do Usuário Logado (DEBUG)</CardTitle>
      <p>Email: {user.email}</p>
      <p>Role: <span className="font-bold">{user.role}</span></p>
      <p>ID: {user.id}</p>
    </Card>
  );
};

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col w-full p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-primary">Olá, bem-vindo(a) de volta!</h1>
          <p className="text-base sm:text-lg text-muted-foreground mt-2">
            Aqui está um resumo rápido do seu negócio hoje.
          </p>
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Button onClick={() => navigate('/new-service-order')} className="px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base w-full">
            <PlusCircle className="h-4 w-4 mr-2 sm:h-5 sm:w-5" /> Nova Ordem de Serviço
          </Button>
        </div>
      </div>
      <DebugUserRole /> {/* Adicionado o componente de depuração aqui */}
      <div className="space-y-10">
        <FinancialSummary />
        
        <Card className="p-4 sm:p-6 shadow-lg">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight">Visão Geral de Vendas</CardTitle>
            <CardDescription className="text-sm sm:text-base text-muted-foreground">Acompanhe suas vendas de aparelhos e PDV.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <SalesSummary />
            <POSSalesSummary />
            <SalesOverviewWidget />
          </CardContent>
        </Card>

        <Card className="p-4 sm:p-6 shadow-lg">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight">Serviços e Clientes</CardTitle>
            <CardDescription className="text-sm sm:text-base text-muted-foreground">Informações sobre garantias, serviços e ticket médio.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <WarrantyOverviewWidget />
            <CommonServicesWidget />
            <AverageTicketWidget />
          </CardContent>
        </Card>

        <ServiceOrderSummary />
      </div>
    </div>
  );
};

export default Index;