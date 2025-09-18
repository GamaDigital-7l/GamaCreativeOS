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
import { Loader2, ArrowDownCircle, CalendarDays, FileText, Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError } from '@/utils/toast';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExpenseTransaction {
  id: string;
  transaction_date: string;
  description: string;
  amount: number;
  category?: string;
}

interface ExpenseReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExpenseReportDialog({ isOpen, onClose }: ExpenseReportDialogProps) {
  const { user } = useSession();
  const [transactions, setTransactions] = useState<ExpenseTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const currentMonth = new Date();

  useEffect(() => {
    if (isOpen && user) {
      fetchExpenseTransactions();
    }
  }, [isOpen, user]);

  const fetchExpenseTransactions = async () => {
    setIsLoading(true);
    const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    try {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('id, transaction_date, description, amount, category')
        .eq('user_id', user?.id)
        .eq('type', 'expense')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      showError(`Erro ao carregar saídas: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const totalExpense = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <ArrowDownCircle className="h-6 w-6" /> Relatório de Saídas
          </DialogTitle>
          <DialogDescription>
            Detalhes de todas as saídas financeiras em {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="flex justify-between items-center text-lg font-bold border-b pb-2">
            <span>Total de Saídas:</span>
            <span className="text-red-600">R$ {totalExpense.toFixed(2)}</span>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-center text-muted-foreground">Nenhuma saída encontrada para este mês.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]"><CalendarDays className="h-4 w-4 inline-block mr-1" /> Data</TableHead>
                    <TableHead><FileText className="h-4 w-4 inline-block mr-1" /> Descrição</TableHead>
                    <TableHead><Tag className="h-4 w-4 inline-block mr-1" /> Categoria</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{format(new Date(t.transaction_date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                      <TableCell>{t.description}</TableCell>
                      <TableCell>{t.category || 'N/A'}</TableCell>
                      <TableCell className="text-right text-red-600">- R$ {t.amount.toFixed(2)}</TableCell>
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