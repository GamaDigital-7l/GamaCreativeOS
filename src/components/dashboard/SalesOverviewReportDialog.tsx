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
import { Loader2, TrendingUp, CalendarDays, User, Smartphone, DollarSign, Package } from 'lucide-react';
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
  acquisition_cost?: number;
  trade_in_details?: { value: number };
  customers: {
    name: string;
  } | null;
}

interface SalesOverviewReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SalesOverviewReportDialog({ isOpen, onClose }: SalesOverviewReportDialogProps) {
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
        .select(`id, created_at, device_brand, device_model, sale_price, acquisition_cost, trade_in_details, customers(name)`)
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

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.sale_price, 0);
  const totalProfit = sales.reduce((sum, sale) => sum + (sale.sale_price - (sale.acquisition_cost || 0) + (sale.trade_in_details?.value || 0)), 0);
  const totalSold = sales.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-indigo-600">
            <TrendingUp className="h-6 w-6" /> Relatório de Visão Geral de Vendas
          </DialogTitle>
          <DialogDescription>
            Detalhes de todas as vendas de aparelhos em {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center text-lg font-bold border-b pb-2">
            <div>
              <Package className="h-5 w-5 inline-block mr-1 text-indigo-600" />
              <span className="text-indigo-600">{totalSold}</span>
              <p className="text-sm text-muted-foreground font-normal">Aparelhos Vendidos</p>
            </div>
            <div>
              <DollarSign className="h-5 w-5 inline-block mr-1 text-green-600" />
              <span className="text-green-600">R$ {totalRevenue.toFixed(2)}</span>
              <p className="text-sm text-muted-foreground font-normal">Receita Total</p>
            </div>
            <div>
              <DollarSign className="h-5 w-5 inline-block mr-1 text-blue-600" />
              <span className={`${totalProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>R$ {totalProfit.toFixed(2)}</span>
              <p className="text-sm text-muted-foreground font-normal">Lucro Total</p>
            </div>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sales.length === 0 ? (
            <p className="text-center text-muted-foreground">Nenhuma venda encontrada para este mês.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]"><CalendarDays className="h-4 w-4 inline-block mr-1" /> Data</TableHead>
                    <TableHead><User className="h-4 w-4 inline-block mr-1" /> Cliente</TableHead>
                    <TableHead><Smartphone className="h-4 w-4 inline-block mr-1" /> Aparelho</TableHead>
                    <TableHead className="text-right">Custo</TableHead>
                    <TableHead className="text-right">Entrada</TableHead>
                    <TableHead className="text-right">Venda</TableHead>
                    <TableHead className="text-right">Lucro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>{format(new Date(sale.created_at), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                      <TableCell>{sale.customers?.name || 'N/A'}</TableCell>
                      <TableCell>{sale.device_brand} {sale.device_model}</TableCell>
                      <TableCell className="text-right">R$ {(sale.acquisition_cost || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right">R$ {(sale.trade_in_details?.value || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right text-green-600">R$ {sale.sale_price.toFixed(2)}</TableCell>
                      <TableCell className={`text-right ${((sale.sale_price - (sale.acquisition_cost || 0) + (sale.trade_in_details?.value || 0)) >= 0) ? 'text-blue-600' : 'text-red-600'}`}>
                        R$ {(sale.sale_price - (sale.acquisition_cost || 0) + (sale.trade_in_details?.value || 0)).toFixed(2)}
                      </TableCell>
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