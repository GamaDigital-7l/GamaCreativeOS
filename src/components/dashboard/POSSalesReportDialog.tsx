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
import { Loader2, Receipt, CalendarDays, User, DollarSign, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError } from '@/utils/toast';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface POSSale {
  id: string;
  created_at: string;
  total_amount: number;
  payment_method?: string;
  customers: {
    name: string;
  } | null;
  pos_sale_items: {
    quantity: number;
    price_at_time: number;
    inventory_items: {
      name: string;
      sku?: string;
    } | null;
  }[];
}

interface POSSalesReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function POSSalesReportDialog({ isOpen, onClose }: POSSalesReportDialogProps) {
  const { user } = useSession();
  const [posSales, setPOSSales] = useState<POSSale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const currentMonth = new Date();

  useEffect(() => {
    if (isOpen && user) {
      fetchPOSSales();
    }
  }, [isOpen, user]);

  const fetchPOSSales = async () => {
    setIsLoading(true);
    const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    try {
      const { data, error } = await supabase
        .from('pos_sales')
        .select(`
          id, created_at, total_amount, payment_method,
          customers(name),
          pos_sale_items(quantity, price_at_time, inventory_items(name, sku))
        `)
        .eq('user_id', user?.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPOSSales(data || []);
    } catch (error: any) {
      showError(`Erro ao carregar vendas PDV: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const totalPOSSalesAmount = posSales.reduce((sum, sale) => sum + sale.total_amount, 0);
  const totalPOSSalesCount = posSales.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-purple-600">
            <Receipt className="h-6 w-6" /> Relatório de Vendas PDV
          </DialogTitle>
          <DialogDescription>
            Detalhes de todas as vendas de Ponto de Venda em {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="flex justify-between items-center text-lg font-bold border-b pb-2">
            <span>Total de Vendas PDV ({totalPOSSalesCount}):</span>
            <span className="text-purple-600">R$ {totalPOSSalesAmount.toFixed(2)}</span>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : posSales.length === 0 ? (
            <p className="text-center text-muted-foreground">Nenhuma venda PDV encontrada para este mês.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]"><CalendarDays className="h-4 w-4 inline-block mr-1" /> Data</TableHead>
                    <TableHead><User className="h-4 w-4 inline-block mr-1" /> Cliente</TableHead>
                    <TableHead><Package className="h-4 w-4 inline-block mr-1" /> Itens</TableHead>
                    <TableHead className="text-right"><DollarSign className="h-4 w-4 inline-block mr-1" /> Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>{format(new Date(sale.created_at), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                      <TableCell>{sale.customers?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <ul className="list-disc list-inside text-sm">
                          {sale.pos_sale_items.map((item, idx) => (
                            <li key={idx}>{item.inventory_items?.name} (x{item.quantity})</li>
                          ))}
                        </ul>
                      </TableCell>
                      <TableCell className="text-right text-purple-600">R$ {sale.total_amount.toFixed(2)}</TableCell>
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