import { SupplierList } from "@/components/suppliers/SupplierList";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SuppliersPage = () => {
  return (
    <div className="p-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-3xl">Fornecedores</CardTitle>
        </CardHeader>
        <CardContent>
          <SupplierList />
        </CardContent>
      </Card>
      <MadeWithDyad />
    </div>
  );
};

export default SuppliersPage;