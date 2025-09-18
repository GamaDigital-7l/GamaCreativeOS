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
import { Loader2, DollarSign, ArrowUpCircle, ArrowDownCircle, CalendarDays, FileText, Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError } from '@/utils/toast';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Transaction {
  id: string;
  transaction_date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category?: string;
}

interface BalanceReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BalanceReportDialog({ isOpen, onClose }: BalanceReportDialogProps) {
  const { user } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const currentMonth = new Date();

  useEffect(() => {
    if (isOpen && user) {
      fetchTransactions();
    }
  }, [isOpen, user]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    try {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('id, transaction_date, description, amount, type, category')
        .eq('user_id', user?.id)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      showError(`Erro ao carregar transações: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            <DollarSign className="h-6 w-6" /> Relatório de Saldo Mensal
          </DialogTitle>
          <DialogDescription>
            Visão geral de todas as entradas e saídas em {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center text-lg font-bold border-b pb-2">
            <div>
              <ArrowUpCircle className="h-5 w-5 inline-block mr-1 text-green-600" />
              <span className="text-green-600">R$ {totalIncome.toFixed(2)}</span>
              <p className="text-sm text-muted-foreground font-normal">Entradas</p>
            </div>
            <div>
              <ArrowDownCircle className="h-5 w-5 inline-block mr-1 text-red-600" />
              <span className="text-red-600">R$ {totalExpense.toFixed(2)}</span>
              <p className="text-sm text-muted-foreground font-normal">Saídas</p>
            </div>
            <div>
              <DollarSign className="h-5 w-5 inline-block mr-1 text-blue-600" />
              <span className="text-blue-600">R$ {balance.toFixed(2)}</span>
              <p className="text-sm text-muted-foreground font-normal">Saldo</p>
            </div>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-center text-muted-foreground">Nenhuma transação encontrada para este mês.</p>
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
                      <TableCell className={`text-right ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
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