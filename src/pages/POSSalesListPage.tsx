import { POSSalesList } from "@/components/pos/POSSalesList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Receipt, PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const POSSalesListPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-background to-primary/10 p-4 sm:p-6">
      <Card className="w-full max-w-6xl mb-6">
        <CardHeader className="flex flex-row items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/pos')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <CardTitle className="text-3xl text-center flex-grow flex items-center justify-center gap-2">
            <Receipt className="h-7 w-7 text-primary" /> Histórico de Vendas PDV
          </CardTitle>
          <Button onClick={() => navigate('/pos')}>
            <PlusCircle className="mr-2 h-4 w-4" /> Nova Venda PDV
          </Button>
        </CardHeader>
        <CardContent>
          <POSSalesList />
        </CardContent>
      </Card>
    </div>
  );
};

export default POSSalesListPage;