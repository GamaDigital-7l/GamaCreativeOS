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
import { Loader2, DollarSign, Users, CalendarDays } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError } from '@/utils/toast';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CustomerSpending {
  customer_id: string;
  customer_name: string;
  total_spent: number;
  transaction_count: number;
}

interface AverageTicketReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AverageTicketReportDialog({ isOpen, onClose }: AverageTicketReportDialogProps) {
  const { user } = useSession();
  const [customerSpendings, setCustomerSpendings] = useState<CustomerSpending[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const currentMonth = new Date();

  useEffect(() => {
    if (isOpen && user) {
      fetchCustomerSpendings();
    }
  }, [isOpen, user]);

  const fetchCustomerSpendings = async () => {
    setIsLoading(true);
    const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    try {
      // Fetch service orders
      const { data: serviceOrders, error: soError } = await supabase
        .from('service_orders')
        .select('customer_id, total_amount, customers(name)')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .eq('user_id', user?.id)
        .not('total_amount', 'is', null)
        .not('customer_id', 'is', null);
      if (soError) throw soError;

      // Fetch sales
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('customer_id, sale_price, customers(name)')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .eq('user_id', user?.id)
        .not('sale_price', 'is', null)
        .not('customer_id', 'is', null);
      if (salesError) throw salesError;

      // Fetch POS sales
      const { data: posSales, error: posSalesError } = await supabase
        .from('pos_sales')
        .select('customer_id, total_amount, customers(name)')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .eq('user_id', user?.id)
        .not('total_amount', 'is', null)
        .not('customer_id', 'is', null);
      if (posSalesError) throw posSalesError;

      const customerMap = new Map<string, { total_spent: number; transaction_count: number; name: string }>();

      serviceOrders?.forEach(order => {
        if (order.customer_id && order.customers?.name) {
          const current = customerMap.get(order.customer_id) || { total_spent: 0, transaction_count: 0, name: order.customers.name };
          current.total_spent += order.total_amount || 0;
          current.transaction_count++;
          customerMap.set(order.customer_id, current);
        }
      });

      sales?.forEach(sale => {
        if (sale.customer_id && sale.customers?.name) {
          const current = customerMap.get(sale.customer_id) || { total_spent: 0, transaction_count: 0, name: sale.customers.name };
          current.total_spent += sale.sale_price || 0;
          current.transaction_count++;
          customerMap.set(sale.customer_id, current);
        }
      });

      posSales?.forEach(posSale => {
        if (posSale.customer_id && posSale.customers?.name) {
          const current = customerMap.get(posSale.customer_id) || { total_spent: 0, transaction_count: 0, name: posSale.customers.name };
          current.total_spent += posSale.total_amount || 0;
          current.transaction_count++;
          customerMap.set(posSale.customer_id, current);
        }
      });

      const result = Array.from(customerMap.entries()).map(([id, data]) => ({
        customer_id: id,
        customer_name: data.name,
        total_spent: data.total_spent,
        transaction_count: data.transaction_count,
      })).sort((a, b) => b.total_spent - a.total_spent); // Sort by total spent

      setCustomerSpendings(result);
    } catch (error: any) {
      showError(`Erro ao carregar dados de gastos dos clientes: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const totalRevenue = customerSpendings.reduce((sum, cs) => sum + cs.total_spent, 0);
  const totalCustomers = customerSpendings.length;
  const averageTicket = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-yellow-600">
            <Users className="h-6 w-6" /> Relatório de Ticket Médio de Clientes
          </DialogTitle>
          <DialogDescription>
            Detalhes dos gastos dos clientes em {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center text-lg font-bold border-b pb-2">
            <div>
              <Users className="h-5 w-5 inline-block mr-1 text-yellow-600" />
              <span className="text-yellow-600">{totalCustomers}</span>
              <p className="text-sm text-muted-foreground font-normal">Clientes Atendidos</p>
            </div>
            <div>
              <DollarSign className="h-5 w-5 inline-block mr-1 text-green-600" />
              <span className="text-green-600">R$ {totalRevenue.toFixed(2)}</span>
              <p className="text-sm text-muted-foreground font-normal">Receita Total</p>
            </div>
            <div>
              <DollarSign className="h-5 w-5 inline-block mr-1 text-blue-600" />
              <span className="text-blue-600">R$ {averageTicket.toFixed(2)}</span>
              <p className="text-sm text-muted-foreground font-normal">Ticket Médio</p>
            </div>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : customerSpendings.length === 0 ? (
            <p className="text-center text-muted-foreground">Nenhum cliente com gastos registrados para este mês.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead><User className="h-4 w-4 inline-block mr-1" /> Cliente</TableHead>
                    <TableHead className="text-right">Total Gasto</TableHead>
                    <TableHead className="text-right">Nº Transações</TableHead>
                    <TableHead className="text-right">Ticket Médio Cliente</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerSpendings.map((cs) => (
                    <TableRow key={cs.customer_id}>
                      <TableCell>{cs.customer_name}</TableCell>
                      <TableCell className="text-right text-green-600">R$ {cs.total_spent.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{cs.transaction_count}</TableCell>
                      <TableCell className="text-right">R$ {(cs.total_spent / cs.transaction_count).toFixed(2)}</TableCell>
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