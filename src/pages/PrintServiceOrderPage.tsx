import React, { useState } from 'react';
import { PrintableServiceOrder } from "@/components/service-orders/PrintableServiceOrder";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from '@/components/ui/card';

const PrintServiceOrderPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [printMode, setPrintMode] = useState<'client_only' | 'store_client'>('client_only');
  const [paperFormat, setPaperFormat] = useState<'a4' | 'receipt'>('a4');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      <div className="p-4 bg-background border-b flex items-center justify-between print:hidden">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/service-orders/${id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">Opções de Impressão</h1>
        <Button onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" /> Imprimir
        </Button>
      </div>

      <div className="p-4 flex-grow flex justify-center items-start">
        <Card className="w-full max-w-md p-4 space-y-6 print:hidden">
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="print-mode" className="mb-2 block font-medium">Vias de Impressão</Label>
              <RadioGroup value={printMode} onValueChange={(value: 'client_only' | 'store_client') => setPrintMode(value)} className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="client_only" id="client-only" />
                  <Label htmlFor="client-only">Somente Cliente</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="store_client" id="store-client" />
                  <Label htmlFor="store-client">Loja e Cliente</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="paper-format" className="mb-2 block font-medium">Formato do Papel</Label>
              <Select value={paperFormat} onValueChange={(value: 'a4' | 'receipt') => setPaperFormat(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a4">A4</SelectItem>
                  <SelectItem value="receipt">Cupom Não Fiscal (Térmica)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* The printable content, hidden by default and shown only for print media */}
      <div className="hidden print:block">
        <PrintableServiceOrder printMode={printMode} paperFormat={paperFormat} />
      </div>
    </div>
  );
};

export default PrintServiceOrderPage;