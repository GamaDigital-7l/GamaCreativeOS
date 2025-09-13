import { NewSupplierForm } from "@/components/suppliers/NewSupplierForm";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NewSupplierPage = () => {
  const navigate = useNavigate();

  return (
    <div className="p-4">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader className="flex flex-row items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/suppliers')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <CardTitle className="text-3xl text-center flex-grow">Novo Fornecedor</CardTitle>
        </CardHeader>
        <CardContent>
          <NewSupplierForm />
        </CardContent>
      </Card>
      <MadeWithDyad />
    </div>
  );
};

export default NewSupplierPage;