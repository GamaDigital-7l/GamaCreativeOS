import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowUpCircle, ArrowDownCircle, DollarSign } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export function FinancialSummary() {
  const { user } = useSession();
  const [transactions, setTransactions] = useState<{ amount: number; type: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const today = new Date();
    const startDate = format(startOfMonth(today), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(today), 'yyyy-MM-dd');

    try {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('amount, type')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .eq('user_id', user.id); // Ensure filtering by user

      if (!error) setTransactions(data || []);
      else console.error("Error fetching financial transactions:", error);
    } catch (err) {
      console.error("Unexpected error fetching financial transactions:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const summary = useMemo(() => {
    return transactions.reduce((acc, t) => {
      if (t.type === 'income') acc.income += t.amount;
      else acc.expense += t.amount;
      return acc;
    }, { income: 0, expense: 0 });
  }, [transactions]);

  const balance = summary.income - summary.expense;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight mb-4">Resumo Financeiro do Mês</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entradas</CardTitle>
            <ArrowUpCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">R$ {summary.income.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total de receitas no mês atual</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saídas</CardTitle>
            <ArrowDownCircle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">R$ {summary.expense.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total de despesas no mês atual</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            <DollarSign className={`h-5 w-5 ${balance >= 0 ? 'text-blue-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${balance >= 0 ? 'text-blue-500' : 'text-red-500'}`}>R$ {balance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Saldo do mês atual</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}