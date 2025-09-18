import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // Added CardDescription
import { Loader2, Clock, Wrench, CheckCircle, Ban, ListTodo, Package, XCircle } from 'lucide-react'; // Adicionado Package, XCircle
import { format } from 'date-fns'; // Import format for date formatting
import { ptBR } from 'date-fns/locale'; // Import ptBR locale

interface ServiceOrderSummaryData {
  orcamento: number;
  aguardando_aprovacao: number; // Para orcamento com pending_approval
  aguardando_pecas: number;
  em_manutencao: number;
  pronto_para_retirada: number;
  finalizado: number;
  nao_teve_reparo: number;
  cancelado_pelo_cliente: number;
  total: number;
}

export function ServiceOrderSummary() {
  const { user, isLoading: isSessionLoading } = useSession();
  const [summary, setSummary] = useState<ServiceOrderSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchServiceOrderSummary = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error, count } = await supabase
        .from('service_orders')
        .select('status, approval_status', { count: 'exact' }) // Selecionar approval_status também
        .eq('user_id', user.id); // Filter by current user's ID

      if (error) throw error;

      const counts = data.reduce((acc, { status, approval_status }) => {
        // Mapear status do DB para categorias de resumo
        if (status === 'orcamento' && approval_status === 'pending_approval') {
          acc.aguardando_aprovacao++;
        } else if (status === 'orcamento') {
          acc.orcamento++;
        } else if (status === 'aguardando_pecas') {
          acc.aguardando_pecas++;
        } else if (status === 'em_manutencao') {
          acc.em_manutencao++;
        } else if (status === 'pronto_para_retirada') {
          acc.pronto_para_retirada++;
        } else if (status === 'finalizado') {
          acc.finalizado++;
        } else if (status === 'nao_teve_reparo') {
          acc.nao_teve_reparo++;
        } else if (status === 'cancelado_pelo_cliente') {
          acc.cancelado_pelo_cliente++;
        }
        return acc;
      }, {
        orcamento: 0,
        aguardando_aprovacao: 0,
        aguardando_pecas: 0,
        em_manutencao: 0,
        pronto_para_retirada: 0,
        finalizado: 0,
        nao_teve_reparo: 0,
        cancelado_pelo_cliente: 0,
      });

      setSummary({ ...counts, total: count || 0 });
    } catch (error: any) {
      console.error("Erro ao buscar resumo das Ordens de Serviço:", error);
      showError(`Erro ao carregar resumo: ${error.message || "Tente novamente."}`);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isSessionLoading && user) {
      fetchServiceOrderSummary();
    } else if (!isSessionLoading && !user) {
      setIsLoading(false);
    }
  }, [user, isSessionLoading, fetchServiceOrderSummary]);

  if (isLoading) {
    return (
      <Card className="p-6 shadow-lg">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-3xl font-bold tracking-tight">Resumo de Ordens de Serviço</CardTitle>
          <CardDescription className="text-muted-foreground">Visão geral do status das suas ordens de serviço.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-48 p-0">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return null;
  }

  const summaryItems = [
    { title: 'Orçamentos', value: summary.orcamento, icon: Clock, color: 'text-yellow-500' },
    { title: 'Aguardando Aprovação', value: summary.aguardando_aprovacao, icon: Clock, color: 'text-orange-500' },
    { title: 'Aguardando Peças', value: summary.aguardando_pecas, icon: Package, color: 'text-indigo-500' },
    { title: 'Em Manutenção', value: summary.em_manutencao, icon: Wrench, color: 'text-blue-500' },
    { title: 'Prontas', value: summary.pronto_para_retirada, icon: CheckCircle, color: 'text-green-500' },
    { title: 'Finalizadas', value: summary.finalizado, icon: CheckCircle, color: 'text-gray-500' },
    { title: 'Não Teve Reparo', value: summary.nao_teve_reparo, icon: Ban, color: 'text-red-500' },
    { title: 'Canceladas pelo Cliente', value: summary.cancelado_pelo_cliente, icon: XCircle, color: 'text-red-700' },
  ];

  return (
    <Card className="p-6 shadow-lg">
      <CardHeader className="p-0 mb-6">
        <CardTitle className="text-3xl font-bold tracking-tight">Resumo de Ordens de Serviço</CardTitle>
        <CardDescription className="text-muted-foreground">Visão geral do status das suas ordens de serviço.</CardDescription>
      </CardHeader>
      <CardContent className="p-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
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
          <Card key={item.title} className={`border-l-4 ${item.color.replace('text-', 'border-')}`}>
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
      </CardContent>
    </Card>
  );
}