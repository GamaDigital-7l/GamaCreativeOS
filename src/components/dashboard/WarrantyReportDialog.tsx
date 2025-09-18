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
import { Loader2, ShieldCheck, CalendarDays, Smartphone, Clock, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError } from '@/utils/toast';
import { format, startOfMonth, endOfMonth, addDays, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

interface SaleWithWarranty {
  id: string;
  created_at: string;
  warranty_days: number;
  device_brand: string;
  device_model: string;
}

interface WarrantyReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WarrantyReportDialog({ isOpen, onClose }: WarrantyReportDialogProps) {
  const { user } = useSession();
  const [sales, setSales] = useState<SaleWithWarranty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const currentMonth = new Date();

  useEffect(() => {
    if (isOpen && user) {
      fetchSalesWithWarranty();
    }
  }, [isOpen, user]);

  const fetchSalesWithWarranty = async () => {
    setIsLoading(true);
    const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    try {
      const { data, error } = await supabase
        .from('sales')
        .select('id, created_at, warranty_days, device_brand, device_model')
        .eq('user_id', user?.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .not('warranty_days', 'is', null)
        .gt('warranty_days', 0)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error: any) {
      showError(`Erro ao carregar vendas com garantia: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getWarrantyStatus = (sale: SaleWithWarranty) => {
    const saleDate = new Date(sale.created_at);
    const warrantyEndDate = addDays(saleDate, sale.warranty_days);
    const daysRemaining = differenceInDays(warrantyEndDate, new Date());

    if (daysRemaining <= 0) {
      return <Badge variant="destructive">Expirada</Badge>;
    } else if (daysRemaining <= 30) {
      return <Badge variant="warning" className="bg-yellow-600 text-white">Vence em {daysRemaining} dias</Badge>;
    } else {
      return <Badge variant="success">Ativa ({daysRemaining} dias)</Badge>;
    }
  };

  const totalActive = sales.filter(sale => {
    const warrantyEndDate = addDays(new Date(sale.created_at), sale.warranty_days);
    return differenceInDays(warrantyEndDate, new Date()) > 0;
  }).length;

  const totalExpiringSoon = sales.filter(sale => {
    const warrantyEndDate = addDays(new Date(sale.created_at), sale.warranty_days);
    const daysRemaining = differenceInDays(warrantyEndDate, new Date());
    return daysRemaining > 0 && daysRemaining <= 30;
  }).length;

  const totalExpired = sales.filter(sale => {
    const warrantyEndDate = addDays(new Date(sale.created_at), sale.warranty_days);
    return differenceInDays(warrantyEndDate, new Date()) <= 0;
  }).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <ShieldCheck className="h-6 w-6" /> Relatório de Garantias
          </DialogTitle>
          <DialogDescription>
            Detalhes das garantias de aparelhos em {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center text-lg font-bold border-b pb-2">
            <div>
              <ShieldCheck className="h-5 w-5 inline-block mr-1 text-green-600" />
              <span className="text-green-600">{totalActive}</span>
              <p className="text-sm text-muted-foreground font-normal">Ativas</p>
            </div>
            <div>
              <Clock className="h-5 w-5 inline-block mr-1 text-yellow-600" />
              <span className="text-yellow-600">{totalExpiringSoon}</span>
              <p className="text-sm text-muted-foreground font-normal">Vencendo em 30 dias</p>
            </div>
            <div>
              <XCircle className="h-5 w-5 inline-block mr-1 text-red-600" />
              <span className="text-red-600">{totalExpired}</span>
              <p className="text-sm text-muted-foreground font-normal">Expiradas</p>
            </div>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sales.length === 0 ? (
            <p className="text-center text-muted-foreground">Nenhuma garantia encontrada para este mês.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]"><CalendarDays className="h-4 w-4 inline-block mr-1" /> Data Venda</TableHead>
                    <TableHead><Smartphone className="h-4 w-4 inline-block mr-1" /> Aparelho</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>{format(new Date(sale.created_at), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                      <TableCell>{sale.device_brand} {sale.device_model}</TableCell>
                      <TableCell>{sale.warranty_days} dias</TableCell>
                      <TableCell>{getWarrantyStatus(sale)}</TableCell>
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