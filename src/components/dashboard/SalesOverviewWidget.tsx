import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShoppingCart, DollarSign, TrendingUp, CalendarDays } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, addMonths, getMonth, getYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogTrigger } from '@/components/ui/dialog'; // Import Dialog and DialogTrigger
import { SalesOverviewReportDialog } from './SalesOverviewReportDialog'; // Import new dialog

interface SaleSummaryData {
  totalSold: number;
  totalRevenue: number;
  totalProfit: number;
  topModels: { model: string; count: number }[];
}

export function SalesOverviewWidget() {
  const { user, isLoading: isSessionLoading } = useSession();
  const [summary, setSummary] = useState<SaleSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isSalesOverviewDialogOpen, setIsSalesOverviewDialogOpen] = useState(false); // State for sales overview dialog

  const fetchSalesSummary = useCallback(async (date: Date) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const startDate = format(startOfMonth(date), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(date), 'yyyy-MM-dd');

      const { data: salesData, error } = await supabase
        .from('sales')
        .select('sale_price, acquisition_cost, device_model')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .eq('user_id', user.id);

      if (error) throw error;

      let totalSold = 0;
      let totalRevenue = 0;
      let totalProfit = 0;
      const modelCounts: { [key: string]: number } = {};

      salesData?.forEach(sale => {
        totalSold++;
        totalRevenue += sale.sale_price || 0;
        totalProfit += (sale.sale_price || 0) - (sale.acquisition_cost || 0);
        modelCounts[sale.device_model] = (modelCounts[sale.device_model] || 0) + 1;
      });

      const topModels = Object.entries(modelCounts)
        .sort(([, countA], [, countB]) => countB - countA)
        .slice(0, 3)
        .map(([model, count]) => ({ model, count }));

      setSummary({ totalSold, totalRevenue, totalProfit, topModels });
    } catch (error) {
      console.error("Erro ao buscar resumo de vendas de aparelhos:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isSessionLoading && user) {
      fetchSalesSummary(currentMonth);
    } else if (!isSessionLoading && !user) {
      setIsLoading(false);
    }
  }, [user, isSessionLoading, currentMonth, fetchSalesSummary]);

  const handleMonthChange = (value: string) => {
    const [year, month] = value.split('-').map(Number);
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const generateMonthOptions = () => {
    const options = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) { // Last 12 months
      const month = subMonths(today, i);
      const value = `${getYear(month)}-${getMonth(month) + 1}`;
      const label = format(month, 'MMMM yyyy', { locale: ptBR });
      options.push({ value, label });
    }
    return options;
  };

  if (isLoading) {
    return (
      <Card className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    );
  }

  return (
    <Dialog open={isSalesOverviewDialogOpen} onOpenChange={setIsSalesOverviewDialogOpen}>
      <DialogTrigger asChild>
        <Card className="h-full flex flex-col border-l-4 border-indigo-500 cursor-pointer hover:bg-muted/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visão Geral de Vendas</CardTitle>
            <Select value={`${getYear(currentMonth)}-${getMonth(currentMonth) + 1}`} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-[150px] h-8 text-sm">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                {generateMonthOptions().map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col justify-between">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Aparelhos Vendidos</p>
                <p className="text-2xl font-bold">{summary?.totalSold || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Vendido</p>
                <p className="text-2xl font-bold text-green-500">R$ {(summary?.totalRevenue || 0).toFixed(2)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Lucro Total</p>
                <p className={`text-2xl font-bold ${((summary?.totalProfit || 0) >= 0) ? 'text-blue-500' : 'text-red-500'}`}>R$ {(summary?.totalProfit || 0).toFixed(2)}</p>
              </div>
            </div>
            {summary && summary.topModels.length > 0 ? (
              <div>
                <p className="text-sm font-medium mb-2">Modelos Mais Vendidos:</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {summary.topModels.map((item, index) => (
                    <li key={index} className="flex justify-between">
                      <span>{item.model}</span>
                      <span>{item.count} unidades</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-center text-muted-foreground text-sm mt-4">Nenhuma venda registrada neste mês.</p>
            )}
          </CardContent>
        </Card>
      </DialogTrigger>
      <SalesOverviewReportDialog isOpen={isSalesOverviewDialogOpen} onClose={() => setIsSalesOverviewDialogOpen(false)} />
    </Dialog>
  );
}