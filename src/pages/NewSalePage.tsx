import { NewSaleForm } from "@/components/sales/NewSaleForm";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PlusCircle, ShoppingCart } from "lucide-react"; // Adicionado PlusCircle, ShoppingCart icons
import { useNavigate } from "react-router-dom";

const NewSalePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-primary/10 p-4 sm:p-6">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="flex flex-row items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/sales')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <CardTitle className="text-3xl text-center flex-grow flex items-center justify-center gap-2">
            <ShoppingCart className="h-7 w-7 text-primary" /> Registrar Nova Venda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <NewSaleForm />
        </CardContent>
      </Card>
      <MadeWithDyad />
    </div>
  );
};

export default NewSalePage;