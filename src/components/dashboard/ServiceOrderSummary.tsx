import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Clock, Wrench, CheckCircle, XCircle, Ban } from 'lucide-react';

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
      const { data, error } = await supabase
        .from('service_orders')
        .select('status', { count: 'exact' });

      if (error) throw error;

      const counts = {
        pending: 0,
        in_progress: 0,
        ready: 0,
        completed: 0,
        cancelled: 0,
        total: 0,
      };

      data.forEach((order: { status: string }) => {
        if (order.status in counts) {
          counts[order.status as keyof Omit<ServiceOrderSummaryData, 'total'>]++;
        }
        counts.total++;
      });

      setSummary(counts);
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
        <p className="ml-2 text-gray-600 dark:text-gray-400">Carregando resumo das Ordens de Serviço...</p>
      </div>
    );
  }

  if (!user) {
    return <p className="text-center text-red-500">Você precisa estar logado para ver o resumo.</p>;
  }

  if (!summary) {
    return <p className="text-center text-gray-600 dark:text-gray-400">Nenhum resumo de Ordem de Serviço disponível.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <Card className="col-span-full bg-primary text-primary-foreground">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Ordens</CardTitle>
          <span className="text-2xl font-bold">{summary.total}</span>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.pending}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Em Progresso</CardTitle>
          <Wrench className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.in_progress}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Prontas</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.ready}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.completed}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
          <Ban className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.cancelled}</div>
        </CardContent>
      </Card>
    </div>
  );
}