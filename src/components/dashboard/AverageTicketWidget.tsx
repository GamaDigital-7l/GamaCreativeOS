import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, DollarSign, Users } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, getMonth, getYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AverageTicketData {
  averageTicket: number;
  totalCustomers: number;
}

export function AverageTicketWidget() {
  const { user, isLoading: isSessionLoading } = useSession();
  const [summary, setSummary] = useState<AverageTicketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fetchAverageTicket = useCallback(async (date: Date) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const startDate = format(startOfMonth(date), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(date), 'yyyy-MM-dd');

      const { data: serviceOrders, error: soError } = await supabase
        .from('service_orders')
        .select('total_amount, customer_id')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .eq('user_id', user.id)
        .not('total_amount', 'is', null)
        .not('customer_id', 'is', null);

      if (soError) throw soError;

      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('sale_price, customer_id')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .eq('user_id', user.id)
        .not('sale_price', 'is', null)
        .not('customer_id', 'is', null);

      if (salesError) throw salesError;

      const { data: posSales, error: posSalesError } = await supabase
        .from('pos_sales')
        .select('total_amount, customer_id')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .eq('user_id', user.id)
        .not('total_amount', 'is', null)
        .not('customer_id', 'is', null);

      if (posSalesError) throw posSalesError;

      let totalRevenue = 0;
      const uniqueCustomers = new Set<string>();

      serviceOrders?.forEach(order => {
        totalRevenue += order.total_amount || 0;
        if (order.customer_id) uniqueCustomers.add(order.customer_id);
      });

      sales?.forEach(sale => {
        totalRevenue += sale.sale_price || 0;
        if (sale.customer_id) uniqueCustomers.add(sale.customer_id);
      });

      posSales?.forEach(posSale => {
        totalRevenue += posSale.total_amount || 0;
        if (posSale.customer_id) uniqueCustomers.add(posSale.customer_id);
      });

      const totalCustomers = uniqueCustomers.size;
      const averageTicket = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

      setSummary({ averageTicket, totalCustomers });
    } catch (error) {
      console.error("Erro ao buscar ticket médio:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isSessionLoading && user) {
      fetchAverageTicket(currentMonth);
    } else if (!isSessionLoading && !user) {
      setIsLoading(false);
    }
  }, [user, isSessionLoading, currentMonth, fetchAverageTicket]);

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
        <CardHeader><CardTitle>Ticket Médio de Clientes</CardTitle></CardHeader>
        <CardContent className="flex justify-center items-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">Ticket Médio de Clientes</CardTitle>
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
            <p className="text-sm text-muted-foreground">Ticket Médio</p>
            <p className="text-2xl font-bold text-blue-500">R$ {(summary?.averageTicket || 0).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Clientes Atendidos</p>
            <p className="text-2xl font-bold">{summary?.totalCustomers || 0}</p>
          </div>
        </div>
        {summary?.totalCustomers === 0 && (
          <p className="text-center text-muted-foreground text-sm mt-4">Nenhum cliente atendido neste mês.</p>
        )}
      </CardContent>
    </Card>
  );
}