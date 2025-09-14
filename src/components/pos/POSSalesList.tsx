import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError } from '@/utils/toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Eye, Search, X, Loader2, Receipt, User, DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface POSSale {
  id: string;
  created_at: string;
  total_amount: number;
  payment_method?: string;
  customers: {
    name: string;
  } | null;
}

export function POSSalesList() {
  const { user, isLoading: isSessionLoading } = useSession();
  const navigate = useNavigate();
  const [posSales, setPOSSales] = useState<POSSale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isSessionLoading && user) {
      fetchPOSSales();
    } else if (!isSessionLoading && !user) {
      setIsLoading(false);
      // navigate('/login'); // Assuming login redirect is handled by SessionContext
    }
  }, [user, isSessionLoading, searchTerm]);

  const fetchPOSSales = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('pos_sales')
        .select(`
          id,
          created_at,
          total_amount,
          payment_method,
          customers (name)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(
          `id.ilike.%${searchTerm}%,customers.name.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      setPOSSales(data || []);
    } catch (error: any) {
      console.error("Erro ao buscar vendas PDV:", error);
      showError(`Erro ao carregar vendas PDV: ${error.message || "Tente novamente."}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="relative flex-grow mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID da venda ou nome do cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-8"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {isLoading ? (
          <p className="text-center text-gray-600 dark:text-gray-400">Carregando vendas PDV...</p>
        ) : !user ? (
          <p className="text-center text-red-500">Você precisa estar logado para ver as vendas PDV.</p>
        ) : posSales.length === 0 ? (
          <p className="text-center text-gray-600 dark:text-gray-400">Nenhuma venda PDV encontrada com os filtros aplicados.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID da Venda</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Método de Pagamento</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posSales.map((sale) => (
                  <TableRow key={sale.id} className="cursor-pointer" onClick={() => navigate(`/pos-sales/${sale.id}`)}>
                    <TableCell className="font-medium">{sale.id.substring(0, 8)}...</TableCell>
                    <TableCell>{format(new Date(sale.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</TableCell>
                    <TableCell className="flex items-center gap-1"><User className="h-4 w-4 text-muted-foreground" />{sale.customers?.name || 'N/A'}</TableCell>
                    <TableCell className="font-semibold text-primary">R$ {sale.total_amount.toFixed(2)}</TableCell>
                    <TableCell>{sale.payment_method || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/pos-sales/${sale.id}`} onClick={(e) => e.stopPropagation()}> {/* Prevent double navigation */}
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}