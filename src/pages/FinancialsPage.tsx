import { FinancialLedger } from "@/components/financials/FinancialLedger";
import { CashRegisterManagement } from "@/components/financials/CashRegisterManagement"; // New import
import { CashRegisterReports } from "@/components/financials/CashRegisterReports"; // New import
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react"; // Import useState

const FinancialsPage = () => {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0); // State to force re-fetch

  const handleUpdate = () => {
    setRefreshKey(prev => prev + 1); // Increment key to trigger re-fetch
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-background to-primary/10 p-4 sm:p-6">
      <Card className="w-full max-w-6xl mb-6">
        <CardHeader className="flex flex-row items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <CardTitle className="text-3xl text-center flex-grow flex items-center justify-center gap-2">
            <DollarSign className="h-7 w-7 text-primary" /> Controle Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CashRegisterManagement onUpdate={handleUpdate} />
          <FinancialLedger key={refreshKey} /> {/* Pass key to force re-render */}
          <CashRegisterReports />
        </CardContent>
      </Card>
      <MadeWithDyad />
    </div>
  );
};

export default FinancialsPage;