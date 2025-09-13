import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { NewTransactionForm } from './NewTransactionForm';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowDownCircle, ArrowUpCircle, DollarSign, Plus, Wallet } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Import Select components

interface Transaction {
  id: string;
  transaction_date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category?: string;
  related_service_order_id?: string;
  related_sale_id?: string;
  related_pos_sale_id?: string;
}

export function FinancialLedger() {
  const { user } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('all'); // New state for filter

  useEffect(() => {
    if (user) fetchTransactions();
  }, [user, transactionTypeFilter]); // Re-fetch when filter changes

  const fetchTransactions = async () => {
    setIsLoading(true);
    const today = new Date();
    const startDate = format(startOfMonth(today), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(today), 'yyyy-MM-dd');

    let query = supabase
      .from('financial_transactions')
      .select('*, related_service_order_id, related_sale_id, related_pos_sale_id') // Select related IDs
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .eq('user_id', user?.id) // Filter by user_id
      .order('transaction_date', { ascending: false });

    // Apply filter based on transactionTypeFilter
    if (transactionTypeFilter === 'service_order') {
      query = query.not('related_service_order_id', 'is', null);
    } else if (transactionTypeFilter === 'device_sale') {
      query = query.not('related_sale_id', 'is', null);
    } else if (transactionTypeFilter === 'pos_sale') {
      query = query.not('related_pos_sale_id', 'is', null);
    } else if (transactionTypeFilter === 'manual') {
      // Filter for transactions that are not related to any specific module
      query = query
        .is('related_service_order_id', null)
        .is('related_sale_id', null)
        .is('related_pos_sale_id', null);
    }

    const { data, error } = await query;

    if (error) showError("Erro ao buscar lançamentos.");
    else setTransactions(data || []);
    setIsLoading(false);
  };

  const summary = useMemo(() => {
    return transactions.reduce((acc, t) => {
      if (t.type === 'income') acc.income += t.amount;
      else acc.expense += t.amount;
      return acc;
    }, { income: 0, expense: 0 });
  }, [transactions]);

  const balance = summary.income - summary.expense;

  return (
    <div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entradas (Mês)</CardTitle>
            <ArrowUpCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">R$ {summary.income.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saídas (Mês)</CardTitle>
            <ArrowDownCircle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">R$ {summary.expense.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo (Mês)</CardTitle>
            <Wallet className={`h-5 w-5 ${balance >= 0 ? 'text-blue-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-500' : 'text-red-500'}`}>R$ {balance.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Lançamentos</SelectItem>
            <SelectItem value="manual">Lançamentos Manuais</SelectItem>
            <SelectItem value="service_order">Ordens de Serviço</SelectItem>
            <SelectItem value="device_sale">Vendas de Aparelhos</SelectItem>
            <SelectItem value="pos_sale">Vendas PDV</SelectItem>
          </SelectContent>
        </Select>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" /> Adicionar Lançamento</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><DollarSign className="h-6 w-6 text-primary" /> Novo Lançamento Financeiro</DialogTitle>
            </DialogHeader>
            <NewTransactionForm onSuccess={() => { fetchTransactions(); setIsFormOpen(false); }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center">Carregando...</TableCell></TableRow>
            ) : transactions.length > 0 ? (
              transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{format(new Date(t.transaction_date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                  <TableCell>{t.description}</TableCell>
                  <TableCell>{t.category || 'N/A'}</TableCell>
                  <TableCell className={`text-right font-medium ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={4} className="text-center">Nenhum lançamento este mês.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}