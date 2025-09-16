import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldCheck, Clock, XCircle, CalendarDays } from 'lucide-react';
import { format, addDays, differenceInDays, startOfMonth, endOfMonth, getMonth, getYear, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SaleWithWarranty {
  id: string;
  created_at: string;
  warranty_days: number;
  device_brand: string;
  device_model: string;
}

interface WarrantySummaryData {
  totalActive: number;
  expiringSoon: number; // Next 30 days
  expired: number;
  activeSales: SaleWithWarranty[];
  expiringSales: SaleWithWarranty[];
}

export function WarrantyOverviewWidget() {
  const { user, isLoading: isSessionLoading } = useSession();
  const [summary, setSummary] = useState<WarrantySummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fetchWarrantySummary = useCallback(async (date: Date) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const startDate = format(startOfMonth(date), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(date), 'yyyy-MM-dd');

      const { data: salesData, error } = await supabase
        .from('sales')
        .select('id, created_at, warranty_days, device_brand, device_model')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .eq('user_id', user.id)
        .not('warranty_days', 'is', null)
        .gt('warranty_days', 0); // Only sales with active warranty periods

      if (error) throw error;

      let totalActive = 0;
      let expiringSoon = 0;
      let expired = 0;
      const activeSales: SaleWithWarranty[] = [];
      const expiringSales: SaleWithWarranty[] = [];
      const today = new Date();

      salesData?.forEach(sale => {
        const saleDate = new Date(sale.created_at);
        const warrantyEndDate = addDays(saleDate, sale.warranty_days);
        const daysRemaining = differenceInDays(warrantyEndDate, today);

        if (daysRemaining > 0) {
          totalActive++;
          activeSales.push(sale);
          if (daysRemaining <= 30) {
            expiringSoon++;
            expiringSales.push(sale);
          }
        } else {
          expired++;
        }
      });

      setSummary({ totalActive, expiringSoon, expired, activeSales, expiringSales });
    } catch (error) {
      console.error("Erro ao buscar resumo de garantias:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isSessionLoading && user) {
      fetchWarrantySummary(currentMonth);
    } else if (!isSessionLoading && !user) {
      setIsLoading(false);
    }
  }, [user, isSessionLoading, currentMonth, fetchWarrantySummary]);

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
      <Card className="h-full">
        <CardHeader><CardTitle>Garantias de Aparelhos</CardTitle></CardHeader>
        <CardContent className="flex justify-center items-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">Garantias de Aparelhos</CardTitle>
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
            <p className="text-sm text-muted-foreground">Garantias Ativas</p>
            <p className="text-2xl font-bold text-green-500">{summary?.totalActive || 0}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Vencendo em 30 dias</p>
            <p className="text-2xl font-bold text-yellow-500">{summary?.expiringSoon || 0}</p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-muted-foreground">Garantias Expiradas</p>
            <p className="text-2xl font-bold text-red-500">{summary?.expired || 0}</p>
          </div>
        </div>
        {summary && summary.expiringSales.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Próximas a Vencer:</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {summary.expiringSales.map((sale, index) => (
                <li key={index} className="flex justify-between">
                  <span>{sale.device_brand} {sale.device_model}</span>
                  <span>ID: {sale.id.substring(0, 4)}...</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {summary?.totalActive === 0 && summary?.expired === 0 && (
          <p className="text-center text-muted-foreground text-sm mt-4">Nenhuma garantia registrada neste mês.</p>
        )}
      </CardContent>
    </Card>
  );
}