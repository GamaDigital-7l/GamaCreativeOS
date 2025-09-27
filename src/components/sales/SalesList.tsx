import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError } from '@/utils/toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Plus, Search, Eye, ShoppingCart, User, Smartphone, DollarSign, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { format, addDays, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CustomBadge as Badge } from '@/components/shared/CustomBadge';

interface Sale {
  id: string;
  created_at: string;
  device_brand: string;
  device_model: string;
  imei_serial: string;
  sale_price: number;
  warranty_days?: number;
  customers: Array<{ name: string }> | null;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

export function SalesList() {
  const { user } = useSession();
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (user) fetchSales();
  }, [user, debouncedSearchTerm, page, pageSize]);

  const fetchSales = async () => {
    setIsLoading(true);
    let query = supabase
      .from('sales')
      .select(`id, created_at, device_brand, device_model, imei_serial, sale_price, warranty_days, customers (name)`, { count: 'exact' })
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);
      
    if (debouncedSearchTerm) {
      query = query.or(
        `device_brand.ilike.%${debouncedSearchTerm}%,device_model.ilike.%${debouncedSearchTerm}%,imei_serial.ilike.%${debouncedSearchTerm}%,customers.name.ilike.%${debouncedSearchTerm}%`
      );
    }

    const { data, error, count } = await query;
    if (error) showError("Erro ao buscar vendas.");
    else setSales(data as Sale[] || []);
    setHasMore((page + 1) * pageSize < (count || 0));
    setIsLoading(false);
  };

  const getWarrantyStatus = (sale: Sale) => {
    if (!sale.warranty_days || sale.warranty_days === 0) {
      return <Badge variant="secondary">Sem Garantia</Badge>;
    }

    const saleDate = new Date(sale.created_at);
    const warrantyEndDate = addDays(saleDate, sale.warranty_days);
    const daysRemaining = differenceInDays(warrantyEndDate, new Date());

    if (daysRemaining <= 0) {
      return <Badge variant="destructive">Garantia Expirada</Badge>;
    } else if (daysRemaining <= 30) {
      return <Badge variant="warning" className="bg-yellow-600 text-white">Expira em {daysRemaining} dias</Badge>;
    } else {
      return <Badge variant="success">Ativa ({daysRemaining} dias)</Badge>;
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por aparelho, IMEI ou cliente..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button asChild className="w-full md:w-auto">
          <Link to="/sales/new">
            <Plus className="mr-2 h-4 w-4" /> Nova Venda
          </Link>
        </Button>
      </div>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Aparelho</TableHead>
              <TableHead>IMEI/Serial</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Garantia</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center">Carregando...</TableCell></TableRow>
            ) : sales.length > 0 ? (
              sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{format(new Date(sale.created_at), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                  <TableCell>{sale.customers?.[0]?.name || 'N/A'}</TableCell>
                  <TableCell>{sale.device_brand} {sale.device_model}</TableCell>
                  <TableCell>{sale.imei_serial}</TableCell>
                  <TableCell>R$ {sale.sale_price.toFixed(2)}</TableCell>
                  <TableCell>{getWarrantyStatus(sale)}</TableCell>
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
              <TableRow><TableCell colSpan={7} className="text-center">Nenhuma venda encontrada.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-center space-x-4 mt-6">
        <Button onClick={() => setPage(prev => Math.max(0, prev - 1))} disabled={page === 0 || isLoading}>
          <ChevronLeft className="h-4 w-4 mr-2" /> Anterior
        </Button>
        <Button onClick={() => setPage(prev => prev + 1)} disabled={!hasMore || isLoading}>
          Próxima <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}