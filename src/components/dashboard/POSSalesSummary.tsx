import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Receipt, DollarSign } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export function POSSalesSummary() {
  const { user, isLoading: isSessionLoading } = useSession();
  const [totalPOSSales, setTotalPOSSales] = useState(0);
  const [totalPOSAmount, setTotalPOSAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPOSSalesSummary = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const today = new Date();
      const startDate = format(startOfMonth(today), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(today), 'yyyy-MM-dd');

      // Fetch financial transactions related to POS sales
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('amount')
        .eq('type', 'income')
        .not('related_pos_sale_id', 'is', null) // Filter for POS sales
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .eq('user_id', user.id);

      if (error) throw error;

      const totalAmountSold = data?.reduce((sum, transaction) => sum + (transaction.amount || 0), 0) || 0;

      setTotalPOSSales(data?.length || 0);
      setTotalPOSAmount(totalAmountSold);
    } catch (error) {
      console.error("Erro ao buscar resumo de vendas PDV:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isSessionLoading && user) {
      fetchPOSSalesSummary();
    } else if (!isSessionLoading && !user) {
      setIsLoading(false);
    }
  }, [user, isSessionLoading, fetchPOSSalesSummary]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Vendas PDV (Mês)</CardTitle>
        <Receipt className="h-5 w-5 text-purple-500" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-purple-500">{totalPOSSales}</div>
        <p className="text-xs text-muted-foreground">Total de vendas PDV este mês</p>
        <div className="text-xl font-bold text-purple-500 mt-2">R$ {totalPOSAmount.toFixed(2)}</div>
        <p className="text-xs text-muted-foreground">Valor total vendido</p>
      </CardContent>
    </Card>
  );
}