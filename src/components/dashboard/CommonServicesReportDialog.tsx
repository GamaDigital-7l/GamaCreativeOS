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
import { Loader2, Wrench, CalendarDays, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError } from '@/utils/toast';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ServiceCount {
  service: string;
  count: number;
}

interface CommonServicesReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommonServicesReportDialog({ isOpen, onClose }: CommonServicesReportDialogProps) {
  const { user } = useSession();
  const [commonServices, setCommonServices] = useState<ServiceCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const currentMonth = new Date();

  useEffect(() => {
    if (isOpen && user) {
      fetchCommonServices();
    }
  }, [isOpen, user]);

  const fetchCommonServices = async () => {
    setIsLoading(true);
    const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    try {
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
          serviceCounts[order.service_details] = (serviceCounts[order.service_details] || 0) + 1;
        }
      });

      const sortedServices = Object.entries(serviceCounts)
        .sort(([, countA], [, countB]) => countB - countA)
        .map(([service, count]) => ({ service, count }));

      setCommonServices(sortedServices);
    } catch (error: any) {
      showError(`Erro ao carregar serviços mais comuns: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <Wrench className="h-6 w-6" /> Relatório de Serviços Mais Comuns
          </DialogTitle>
          <DialogDescription>
            Detalhes dos serviços mais frequentemente realizados em {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="flex justify-between items-center text-lg font-bold border-b pb-2">
            <span>Total de Serviços Registrados:</span>
            <span className="text-orange-600">{commonServices.reduce((sum, s) => sum + s.count, 0)}</span>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : commonServices.length === 0 ? (
            <p className="text-center text-muted-foreground">Nenhum serviço registrado para este mês.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead><Wrench className="h-4 w-4 inline-block mr-1" /> Serviço</TableHead>
                    <TableHead className="text-right"><TrendingUp className="h-4 w-4 inline-block mr-1" /> Frequência</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commonServices.map((service, index) => (
                    <TableRow key={index}>
                      <TableCell>{service.service}</TableCell>
                      <TableCell className="text-right">{service.count} vezes</TableCell>
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