import { ServiceOrderList } from "@/components/service-orders/ServiceOrderList";
import { ServiceOrderKanban } from "@/components/service-orders/ServiceOrderKanban"; // Importar o Kanban
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Wrench, List, LayoutGrid } from "lucide-react"; // Adicionado List e LayoutGrid icons
import { useNavigate } from "react-router-dom";
import { useState } from "react"; // Importar useState

const ServiceOrdersPage = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list'); // Estado para alternar a visualização

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-background to-primary/10 p-4 sm:p-6">
      <Card className="w-full max-w-6xl mb-6">
        <CardHeader className="flex flex-row items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <CardTitle className="text-3xl text-center flex-grow flex items-center justify-center gap-2">
            <Wrench className="h-7 w-7 text-primary" /> Ordens de Serviço
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4 mr-2" /> Lista
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('kanban')}
            >
              <LayoutGrid className="h-4 w-4 mr-2" /> Kanban
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'list' ? <ServiceOrderList /> : <ServiceOrderKanban />}
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceOrdersPage;