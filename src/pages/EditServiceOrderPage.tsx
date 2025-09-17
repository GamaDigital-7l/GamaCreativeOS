import { EditServiceOrderForm } from "@/components/service-orders/EditServiceOrderForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings, Wrench } from "lucide-react"; // Adicionado Settings, Wrench icons
import { useNavigate, useParams } from "react-router-dom";

const EditServiceOrderPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-primary/10 p-4 sm:p-6">
      <Card className="w-full max-w-3xl">
        <CardHeader className="flex flex-row items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/service-orders/${id}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <CardTitle className="text-3xl text-center flex-grow flex items-center justify-center gap-2">
            <Wrench className="h-7 w-7 text-primary" /> Editar Ordem de Serviço
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EditServiceOrderForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default EditServiceOrderPage;