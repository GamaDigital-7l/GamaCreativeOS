import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Clock, Wrench, CheckCircle, Ban, ListTodo } from 'lucide-react';

interface ServiceOrderSummaryData {
  pending: number;
  in_progress: number;
  ready: number;
  completed: number;
  cancelled: number;
  total: number;
}

export function ServiceOrderSummary() {
  const { user, isLoading: isSessionLoading } = useSession();
  const [summary, setSummary] = useState<ServiceOrderSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSessionLoading && user) {
      fetchServiceOrderSummary();
    } else if (!isSessionLoading && !user) {
      setIsLoading(false);
    }
  }, [user, isSessionLoading]);

  const fetchServiceOrderSummary = async () => {
    setIsLoading(true);
    try {
      const { data, error, count } = await supabase
        .from('service_orders')
        .select('status', { count: 'exact' });

      if (error) throw error;

      const counts = data.reduce((acc, { status }) => {
        if (status in acc) {
          acc[status]++;
        }
        return acc;
      }, {
        pending: 0,
        in_progress: 0,
        ready: 0,
        completed: 0,
        cancelled: 0,
      });

      setSummary({ ...counts, total: count || 0 });
    } catch (error: any) {
      console.error("Erro ao buscar resumo das Ordens de Serviço:", error);
      showError(`Erro ao carregar resumo: ${error.message || "Tente novamente."}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const summaryItems = [
    { title: 'Pendentes', value: summary.pending, icon: Clock, color: 'text-yellow-500' },
    { title: 'Em Progresso', value: summary.in_progress, icon: Wrench, color: 'text-blue-500' },
    { title: 'Prontas', value: summary.ready, icon: CheckCircle, color: 'text-green-500' },
    { title: 'Concluídas', value: summary.completed, icon: CheckCircle, color: 'text-gray-500' },
    { title: 'Canceladas', value: summary.cancelled, icon: Ban, color: 'text-red-500' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight mb-4">Resumo de Ordens de Serviço</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="col-span-full sm:col-span-2 lg:col-span-3 xl:col-span-1 bg-primary/10 border-primary/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Ordens</CardTitle>
            <ListTodo className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{summary.total}</div>
            <p className="text-xs text-muted-foreground">Total de OS registradas</p>
          </CardContent>
        </Card>
        {summaryItems.map(item => (
          <Card key={item.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${item.color}`}>{item.value}</div>
              <p className="text-xs text-muted-foreground">Ordens com este status</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}