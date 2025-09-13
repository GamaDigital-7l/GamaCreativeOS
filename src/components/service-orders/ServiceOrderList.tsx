import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError } from '@/utils/toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

interface ServiceOrder {
  id: string;
  created_at: string;
  status: string;
  issue_description: string;
  customers: {
    name: string;
    phone?: string;
  };
  devices: {
    brand: string;
    model: string;
  };
}

export function ServiceOrderList() {
  const { user, isLoading: isSessionLoading } = useSession();
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
          customers (name, phone),
          devices (brand, model)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setServiceOrders(data as ServiceOrder[]);
    } catch (error: any) {
      console.error("Erro ao buscar Ordens de Serviço:", error);
      showError(`Erro ao carregar Ordens de Serviço: ${error.message || "Tente novamente."}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <p className="text-center text-gray-600 dark:text-gray-400">Carregando Ordens de Serviço...</p>;
  }

  if (!user) {
    return <p className="text-center text-red-500">Você precisa estar logado para ver as Ordens de Serviço.</p>;
  }

  if (serviceOrders.length === 0) {
    return <p className="text-center text-gray-600 dark:text-gray-400">Nenhuma Ordem de Serviço encontrada.</p>;
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'in_progress':
        return 'default';
      case 'ready':
        return 'success'; // Assuming a 'success' variant exists or can be styled
      case 'completed':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Ordens de Serviço</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Aparelho</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Descrição do Problema</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id.substring(0, 8)}...</TableCell>
                  <TableCell>{format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</TableCell>
                  <TableCell>{order.customers?.name || 'N/A'}</TableCell>
                  <TableCell>{order.devices?.brand} {order.devices?.model}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(order.status)}>
                      {order.status === 'pending' && 'Pendente'}
                      {order.status === 'in_progress' && 'Em Progresso'}
                      {order.status === 'ready' && 'Pronto'}
                      {order.status === 'completed' && 'Concluído'}
                      {order.status === 'cancelled' && 'Cancelado'}
                      {!['pending', 'in_progress', 'ready', 'completed', 'cancelled'].includes(order.status) && order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{order.issue_description}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/service-orders/${order.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}