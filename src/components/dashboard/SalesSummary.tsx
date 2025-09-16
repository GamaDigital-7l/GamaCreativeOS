import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShoppingCart, DollarSign } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale'; // Import ptBR locale

export function SalesSummary() {
  const { user, isLoading: isSessionLoading } = useSession();
  const [totalSales, setTotalSales] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSalesSummary = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const today = new Date();
      const startDate = format(startOfMonth(today), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(today), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('sales')
        .select('sale_price', { count: 'exact' })
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .eq('user_id', user.id);

      if (error) throw error;

      const totalAmountSold = data?.reduce((sum, sale) => sum + (sale.sale_price || 0), 0) || 0;

      setTotalSales(data?.length || 0);
      setTotalAmount(totalAmountSold);
    } catch (error) {
      console.error("Erro ao buscar resumo de vendas de aparelhos:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isSessionLoading && user) {
      fetchSalesSummary();
    } else if (!isSessionLoading && !user) {
      setIsLoading(false);
    }
  }, [user, isSessionLoading, fetchSalesSummary]);

  if (isLoading) {
    return (
      <Card className="h-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-blue-500">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Vendas de Aparelhos</CardTitle>
        <ShoppingCart className="h-5 w-5 text-blue-500" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-blue-500">{totalSales}</div>
        <p className="text-xs text-muted-foreground">Total de vendas em {format(new Date(), 'MMMM', { locale: ptBR })}</p>
        <div className="text-xl font-bold text-blue-500 mt-2">R$ {totalAmount.toFixed(2)}</div>
        <p className="text-xs text-muted-foreground">Valor total vendido</p>
      </CardContent>
    </Card>
  );
}