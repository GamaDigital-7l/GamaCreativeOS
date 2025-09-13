import { CustomerList } from "@/components/customers/CustomerList";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CustomersPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-background to-primary/10 p-4 sm:p-6">
      <Card className="w-full max-w-6xl mb-6">
        <CardHeader className="flex flex-row items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <CardTitle className="text-3xl text-center flex-grow">Gerenciar Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerList />
        </CardContent>
      </Card>
      <MadeWithDyad />
    </div>
  );
};

export default CustomersPage;