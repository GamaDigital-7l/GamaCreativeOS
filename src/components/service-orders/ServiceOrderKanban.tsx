import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Smartphone, Clock, CheckCircle, Wrench, Package, Ban, XCircle, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ServiceOrder {
  id: string;
  created_at: string;
  status: string;
  issue_description: string;
  total_amount?: number;
  customers: {
    name: string;
  };
  devices: {
    brand: string;
    model: string;
  };
}

// Definindo os status para as colunas do Kanban
const kanbanColumns = [
  { value: 'orcamento', label: 'Orçamento', color: 'bg-yellow-500' },
  { value: 'aguardando_pecas', label: 'Aguardando Peças', color: 'bg-indigo-500' },
  { value: 'em_manutencao', label: 'Em Manutenção', color: 'bg-blue-500' },
  { value: 'pronto_para_retirada', label: 'Pronto para Retirada', color: 'bg-green-500' },
  { value: 'finalizado', label: 'Finalizado', color: 'bg-gray-500' },
  { value: 'nao_teve_reparo', label: 'Não Teve Reparo', color: 'bg-red-500' },
  { value: 'cancelado_pelo_cliente', label: 'Cancelado pelo Cliente', color: 'bg-red-700' },
];

// Helper para obter a variante do badge (igual ao ServiceOrderList)
const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'orcamento':
      return 'secondary';
    case 'aguardando_pecas':
      return 'warning';
    case 'em_manutencao':
      return 'default';
    case 'pronto_para_retirada':
      return 'success';
    case 'finalizado':
      return 'outline';
    case 'nao_teve_reparo':
    case 'cancelado_pelo_cliente':
      return 'destructive';
    default:
      return 'secondary';
  }
};

export function ServiceOrderKanban() {
  const { user, isLoading: isSessionLoading } = useSession();
  const [ordersByStatus, setOrdersByStatus] = useState<Record<string, ServiceOrder[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!isSessionLoading && user) {
      fetchServiceOrders();
    } else if (!isSessionLoading && !user) {
      setIsLoading(false);
    }
  }, [user, isSessionLoading]);

  const fetchServiceOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_orders')
        .select(`
          id,
          created_at,
          status,
          issue_description,
          total_amount,
          customers (name),
          devices (brand, model)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const groupedOrders: Record<string, ServiceOrder[]> = {};
      kanbanColumns.forEach(col => (groupedOrders[col.value] = [])); // Initialize all columns

      (data as ServiceOrder[]).forEach(order => {
        if (groupedOrders[order.status]) {
          groupedOrders[order.status].push(order);
        } else {
          // Fallback for any unexpected status
          groupedOrders['em_manutencao'].push(order); 
        }
      });
      setOrdersByStatus(groupedOrders);
    } catch (error: any) {
      console.error("Erro ao buscar Ordens de Serviço para Kanban:", error);
      showError(`Erro ao carregar Ordens de Serviço: ${error.message || "Tente novamente."}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('service_orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .eq('user_id', user?.id);

      if (error) throw error;
      showSuccess(`Status da OS ${orderId.substring(0, 8)}... atualizado para ${newStatus}!`);
      fetchServiceOrders(); // Refresh the board
    } catch (error: any) {
      showError(`Erro ao atualizar status: ${error.message}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!user) {
    return <p className="text-center text-red-500">Você precisa estar logado para ver o Kanban.</p>;
  }

  return (
    <div className="flex overflow-x-auto space-x-4 p-2">
      {kanbanColumns.map(column => (
        <div key={column.value} className="flex-shrink-0 w-72 md:w-80 bg-card rounded-lg shadow-md border"> {/* Ajustado w-72 para mobile */}
          <CardHeader className={`py-3 px-4 rounded-t-lg ${column.color} text-white`}>
            <CardTitle className="text-lg font-semibold flex justify-between items-center">
              {column.label}
              <Badge variant="secondary" className="bg-white text-gray-800">
                {ordersByStatus[column.value]?.length || 0}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-3 min-h-[200px]">
            {ordersByStatus[column.value]?.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Nenhuma OS aqui.</p>
            ) : (
              ordersByStatus[column.value].map(order => (
                <Card key={order.id} className="bg-background p-3 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="p-0 pb-2 border-b border-border mb-2">
                    <CardTitle className="text-base font-semibold flex justify-between items-center">
                      <Link to={`/service-orders/${order.id}`} className="hover:underline">
                        OS: {order.id.substring(0, 8)}...
                      </Link>
                      <Badge variant={getStatusBadgeVariant(order.status)}>{column.label}</Badge>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {format(new Date(order.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 space-y-1">
                    <p className="text-sm flex items-center gap-1"><User className="h-3 w-3 text-muted-foreground" /> {order.customers?.name}</p>
                    <p className="text-sm flex items-center gap-1"><Smartphone className="h-3 w-3 text-muted-foreground" /> {order.devices?.brand} {order.devices?.model}</p>
                    <p className="text-sm line-clamp-2">{order.issue_description}</p>
                    {order.total_amount && (
                      <p className="text-md font-bold text-right text-primary">R$ {order.total_amount.toFixed(2)}</p>
                    )}
                    <div className="mt-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full" disabled={isUpdatingStatus}>
                            <Wrench className="h-3 w-3 mr-2" /> Mudar Status
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-2 w-48">
                          <Select onValueChange={(newStatus) => handleStatusChange(order.id, newStatus)}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Novo Status" />
                            </SelectTrigger>
                            <SelectContent>
                              {kanbanColumns.map(s => (
                                <SelectItem key={s.value} value={s.value} disabled={s.value === order.status}>
                                  {s.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </div>
      ))}
    </div>
  );
}