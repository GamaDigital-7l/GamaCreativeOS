import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Receipt, DollarSign } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale'; // Import ptBR locale
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { POSSalesReportDialog } from './POSSalesReportDialog'; // Import new dialog

export function POSSalesSummary() {
  const { user, isLoading: isSessionLoading } = useSession();
  const [totalPOSSales, setTotalPOSSales] = useState(0);
  const [totalPOSAmount, setTotalPOSAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPOSSalesDialogOpen, setIsPOSSalesDialogOpen] = useState(false); // State for POS sales dialog

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
      <Card className="h-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </Card>
    );
  }

  return (
    <Dialog open={isPOSSalesDialogOpen} onOpenChange={setIsPOSSalesDialogOpen}>
      <DialogTrigger asChild>
        <Card className="border-l-4 border-purple-500 cursor-pointer hover:bg-muted/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas PDV</CardTitle>
            <Receipt className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-500">{totalPOSSales}</div>
            <p className="text-xs text-muted-foreground">Total de vendas PDV em {format(new Date(), 'MMMM', { locale: ptBR })}</p>
            <div className="text-xl font-bold text-purple-500 mt-2">R$ {totalPOSAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Valor total vendido</p>
          </CardContent>
        </Card>
      </DialogTrigger>
      <POSSalesReportDialog isOpen={isPOSSalesDialogOpen} onClose={() => setIsPOSSalesDialogOpen(false)} />
    </Dialog>
  );
}