import { EditInventoryItemForm } from "@/components/inventory/EditInventoryItemForm";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

const EditInventoryItemPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-primary/10 p-4 sm:p-6">
      <Card className="w-full max-w-3xl">
        <CardHeader className="flex flex-row items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/inventory/${id}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <CardTitle className="text-3xl text-center flex-grow">Editar Item de Estoque</CardTitle>
        </CardHeader>
        <CardContent>
          <EditInventoryItemForm />
        </CardContent>
      </Card>
      <MadeWithDyad />
    </div>
  );
};

export default EditInventoryItemPage;