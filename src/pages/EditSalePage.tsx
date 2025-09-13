import { EditSaleForm } from "@/components/sales/EditSaleForm";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
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
          <CardTitle className="text-3xl text-center flex-grow">Editar Venda</CardTitle>
        </CardHeader>
        <CardContent>
          <EditSaleForm />
        </CardContent>
      </Card>
      <MadeWithDyad />
    </div>
  );
};

export default EditSalePage;