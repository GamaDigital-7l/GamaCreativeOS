import { SalesList } from "@/components/sales/SalesList";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SalesPage = () => {
  return (
    <div className="p-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-3xl">Vendas de Aparelhos</CardTitle>
        </CardHeader>
        <CardContent>
          <SalesList />
        </CardContent>
      </Card>
      <MadeWithDyad />
    </div>
  );
};

export default SalesPage;