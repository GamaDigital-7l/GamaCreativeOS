import { EditSaleForm } from "@/components/sales/EditSaleForm";
import { GamaLogo } from "@/components/GamaLogo"; // Updated import
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings, ShoppingCart } from "lucide-react"; // Adicionado Settings, ShoppingCart icons
import { useNavigate, useParams } from "react-router-dom";

const EditSalePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-primary/10 p-4 sm:p-6">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="flex flex-row items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/sales/${id}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <CardTitle className="text-3xl text-center flex-grow flex items-center justify-center gap-2">
            <ShoppingCart className="h-7 w-7 text-primary" /> Editar Venda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EditSaleForm />
        </CardContent>
      </Card>
      <GamaLogo /> {/* Using the new GamaLogo component */}
    </div>
  );
};

export default EditSalePage;