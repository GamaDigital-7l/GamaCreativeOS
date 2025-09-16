import { NewInventoryItemForm } from "@/components/inventory/NewInventoryItemForm";
import { GamaCreative } from "@/components/gama-creative";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PlusCircle, Package } from "lucide-react"; // Adicionado PlusCircle, Package icons
import { useNavigate } from "react-router-dom";

const NewInventoryItemPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-primary/10 p-4 sm:p-6">
      <Card className="w-full max-w-3xl">
        <CardHeader className="flex flex-row items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/inventory')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <CardTitle className="text-3xl text-center flex-grow flex items-center justify-center gap-2">
            <Package className="h-7 w-7 text-primary" /> Novo Item de Estoque
          </CardTitle>
        </CardHeader>
        <CardContent>
          <NewInventoryItemForm />
        </CardContent>
      </Card>
      <GamaCreative />
    </div>
  );
};

export default NewInventoryItemPage;