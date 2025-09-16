import { EditCustomerForm } from "@/components/customers/EditCustomerForm";
import { GamaCreative } from "@/components/gama-creative";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserCog } from "lucide-react"; // Adicionado UserCog icon
import { useNavigate, useParams } from "react-router-dom";

const EditCustomerPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-primary/10 p-4 sm:p-6">
      <Card className="w-full max-w-3xl">
        <CardHeader className="flex flex-row items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/customers/${id}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <CardTitle className="text-3xl text-center flex-grow flex items-center justify-center gap-2">
            <UserCog className="h-7 w-7 text-primary" /> Editar Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EditCustomerForm />
        </CardContent>
      </Card>
      <GamaCreative />
    </div>
  );
};

export default EditCustomerPage;