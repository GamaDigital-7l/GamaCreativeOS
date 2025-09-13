import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Wrench, TrendingUp } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, getMonth, getYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CommonServicesData {
  service: string;
  count: number;
}

export function CommonServicesWidget() {
  const { user, isLoading: isSessionLoading } = useSession();
  const [commonServices, setCommonServices] = useState<CommonServicesData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (!isSessionLoading && user) {
      fetchCommonServices(currentMonth);
    } else if (!isSessionLoading && !user) {
      setIsLoading(false);
    }
  }, [user, isSessionLoading, currentMonth]);

  const fetchCommonServices = async (date: Date) => {
    setIsLoading(true);
    try {
      const startDate = format(startOfMonth(date), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(date), 'yyyy-MM-dd');

      const { data: serviceOrders, error } = await supabase
        .from('service_orders')
        .select('service_details')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .eq('user_id', user?.id)
        .not('service_details', 'is', null);

      if (error) throw error;

      const serviceCounts: { [key: string]: number } = {};
      serviceOrders?.forEach(order => {
        if (order.service_details) {
          // Simple approach: count unique service detail strings
          // For more advanced analysis, you might need to categorize/normalize service descriptions
          serviceCounts[order.service_details] = (serviceCounts[order.service_details] || 0) + 1;
        }
      });

      const sortedServices = Object.entries(serviceCounts)
        .sort(([, countA], [, countB]) => countB - countA)
        .slice(0, 5) // Top 5 common services
        .map(([service, count]) => ({ service, count }));

      setCommonServices(sortedServices);
    } catch (error) {
      console.error("Erro ao buscar serviços mais comuns:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
        <CardHeader><CardTitle>Serviços Mais Comuns</CardTitle></CardHeader>
        <CardContent className="flex justify-center items-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">Serviços Mais Comuns</CardTitle>
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
        {commonServices.length > 0 ? (
          <ul className="space-y-2">
            {commonServices.map((item, index) => (
              <li key={index} className="flex justify-between items-center text-sm">
                <span className="font-medium">{item.service}</span>
                <span className="text-muted-foreground">{item.count} vezes</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-muted-foreground text-sm mt-4">Nenhum serviço registrado neste mês.</p>
        )}
      </CardContent>
    </Card>
  );
}