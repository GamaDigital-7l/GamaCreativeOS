import { PointOfSale } from "@/components/pos/PointOfSale";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Receipt, History } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PointOfSalePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-background to-primary/10 p-4 sm:p-6">
      <Card className="w-full max-w-7xl mb-6">
        <CardHeader className="flex flex-row items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <CardTitle className="text-3xl text-center flex-grow flex items-center justify-center gap-2">
            <Receipt className="h-7 w-7 text-primary" /> PDV
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/pos/history')}>
              <History className="mr-2 h-4 w-4" /> Consultar Vendas
            </Button>
            {/* A interface atual já é para iniciar uma nova venda. */}
          </div>
        </CardHeader>
        <CardContent>
          <PointOfSale />
        </CardContent>
      </Card>
    </div>
  );
};

export default PointOfSalePage;