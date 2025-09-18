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
import { Loader2, ShoppingCart, CalendarDays, User, Smartphone, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError } from '@/utils/toast';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Sale {
  id: string;
  created_at: string;
  device_brand: string;
  device_model: string;
  sale_price: number;
  customers: {
    name: string;
  } | null;
}

interface SalesReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SalesReportDialog({ isOpen, onClose }: SalesReportDialogProps) {
  const { user } = useSession();
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const currentMonth = new Date();

  useEffect(() => {
    if (isOpen && user) {
      fetchSales();
    }
  }, [isOpen, user]);

  const fetchSales = async () => {
    setIsLoading(true);
    const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`id, created_at, device_brand, device_model, sale_price, customers(name)`)
        .eq('user_id', user?.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error: any) {
      showError(`Erro ao carregar vendas: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const totalSalesAmount = sales.reduce((sum, sale) => sum + sale.sale_price, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            <ShoppingCart className="h-6 w-6" /> Relatório de Vendas de Aparelhos
          </DialogTitle>
          <DialogDescription>
            Detalhes de todas as vendas de aparelhos em {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="flex justify-between items-center text-lg font-bold border-b pb-2">
            <span>Total Vendido:</span>
            <span className="text-blue-600">R$ {totalSalesAmount.toFixed(2)}</span>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sales.length === 0 ? (
            <p className="text-center text-muted-foreground">Nenhuma venda de aparelho encontrada para este mês.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]"><CalendarDays className="h-4 w-4 inline-block mr-1" /> Data</TableHead>
                    <TableHead><User className="h-4 w-4 inline-block mr-1" /> Cliente</TableHead>
                    <TableHead><Smartphone className="h-4 w-4 inline-block mr-1" /> Aparelho</TableHead>
                    <TableHead className="text-right"><DollarSign className="h-4 w-4 inline-block mr-1" /> Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>{format(new Date(sale.created_at), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                      <TableCell>{sale.customers?.name || 'N/A'}</TableCell>
                      <TableCell>{sale.device_brand} {sale.device_model}</TableCell>
                      <TableCell className="text-right text-blue-600">R$ {sale.sale_price.toFixed(2)}</TableCell>
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