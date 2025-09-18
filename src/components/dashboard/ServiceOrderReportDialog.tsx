"use client";

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Wrench, CalendarDays, User, Smartphone, Clock, CheckCircle, Ban, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError } from '@/utils/toast';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

interface ServiceOrder {
  id: string;
  created_at: string;
  status: string;
  issue_description: string;
  customers: {
    name: string;
  } | null;
  devices: {
    brand: string;
    model: string;
  } | null;
}

const serviceOrderStatuses = [
  { value: 'orcamento', label: 'Orçamento', variant: 'secondary' },
  { value: 'aguardando_pecas', label: 'Aguardando Peças', variant: 'warning' },
  { value: 'em_manutencao', label: 'Em Manutenção', variant: 'default' },
  { value: 'pronto_para_retirada', label: 'Pronto para Retirada', variant: 'success' },
  { value: 'finalizado', label: 'Finalizado', variant: 'outline' },
  { value: 'nao_teve_reparo', label: 'Não Teve Reparo', variant: 'destructive' },
  { value: 'cancelado_pelo_cliente', label: 'Cancelado pelo Cliente', variant: 'destructive' },
];

interface ServiceOrderReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ServiceOrderReportDialog({ isOpen, onClose }: ServiceOrderReportDialogProps) {
  const { user } = useSession();
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const currentMonth = new Date();

  useEffect(() => {
    if (isOpen && user) {
      fetchServiceOrders();
    }
  }, [isOpen, user]);

  const fetchServiceOrders = async () => {
    setIsLoading(true);
    const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    try {
      const { data, error } = await supabase
        .from('service_orders')
        .select(`id, created_at, status, issue_description, customers(name), devices(brand, model)`)
        .eq('user_id', user?.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServiceOrders(data || []);
    } catch (error: any) {
      showError(`Erro ao carregar ordens de serviço: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    return serviceOrderStatuses.find(s => s.value === status)?.variant || 'secondary';
  };

  const getStatusLabel = (status: string) => {
    return serviceOrderStatuses.find(s => s.value === status)?.label || status;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Wrench className="h-6 w-6" /> Relatório de Ordens de Serviço
          </DialogTitle>
          <DialogDescription>
            Detalhes de todas as ordens de serviço em {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="flex justify-between items-center text-lg font-bold border-b pb-2">
            <span>Total de OS:</span>
            <span className="text-primary">{serviceOrders.length}</span>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : serviceOrders.length === 0 ? (
            <p className="text-center text-muted-foreground">Nenhuma ordem de serviço encontrada para este mês.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]"><CalendarDays className="h-4 w-4 inline-block mr-1" /> Data</TableHead>
                    <TableHead><User className="h-4 w-4 inline-block mr-1" /> Cliente</TableHead>
                    <TableHead><Smartphone className="h-4 w-4 inline-block mr-1" /> Aparelho</TableHead>
                    <TableHead><Clock className="h-4 w-4 inline-block mr-1" /> Status</TableHead>
                    <TableHead>Descrição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{format(new Date(order.created_at), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                      <TableCell>{order.customers?.name || 'N/A'}</TableCell>
                      <TableCell>{order.devices?.brand} {order.devices?.model}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(order.status)}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{order.issue_description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}