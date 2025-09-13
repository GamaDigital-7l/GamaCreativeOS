import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError } from '@/utils/toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Plus, Search, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Sale {
  id: string;
  created_at: string;
  device_brand: string;
  device_model: string;
  imei_serial: string;
  sale_price: number;
  customers: { name: string } | null;
}

export function SalesList() {
  const { user } = useSession();
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) fetchSales();
  }, [user]);

  const fetchSales = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('sales')
      .select(`*, customers (name)`)
      .order('created_at', { ascending: false });
      
    if (error) showError("Erro ao buscar vendas.");
    else setSales(data as any || []);
    setIsLoading(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Buscar..." className="pl-8" />
        </div>
        <Button asChild>
          <Link to="/sales/new">
            <Plus className="mr-2 h-4 w-4" /> Nova Venda
          </Link>
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Aparelho</TableHead>
              <TableHead>IMEI/Serial</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center">Carregando...</TableCell></TableRow>
            ) : sales.length > 0 ? (
              sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{format(new Date(sale.created_at), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                  <TableCell>{sale.customers?.name || 'N/A'}</TableCell>
                  <TableCell>{sale.device_brand} {sale.device_model}</TableCell>
                  <TableCell>{sale.imei_serial}</TableCell>
                  <TableCell>R$ {sale.sale_price.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/sales/${sale.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={6} className="text-center">Nenhuma venda encontrada.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}