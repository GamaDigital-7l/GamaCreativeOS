import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { NewTransactionForm } from './NewTransactionForm';
import { NewExpenseForm } from './NewExpenseForm'; // Import NewExpenseForm
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowDownCircle, ArrowUpCircle, DollarSign, Plus, Minus, Wallet, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  cash_register_id?: string; // New field
}

interface CashRegister {
  id: string;
  opening_time: string;
  closing_time: string | null;
  initial_balance: number;
  final_balance: number | null;
  status: 'open' | 'closed';
}

export function FinancialLedger() {
  const { user } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isIncomeFormOpen, setIsIncomeFormOpen] = useState(false); // Renamed for clarity
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false); // New state for expense form
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('all');
  const [currentCashRegister, setCurrentCashRegister] = useState<CashRegister | null>(null);

  useEffect(() => {
    if (user) {
      fetchCurrentCashRegister();
    }
  }, [user]);

  useEffect(() => {
    if (user && currentCashRegister !== null) { // Only fetch transactions if cash register status is known
      fetchTransactions();
    }
  }, [user, transactionTypeFilter, currentCashRegister]);

  const fetchCurrentCashRegister = async () => {
    try {
      const { data, error } = await supabase
        .from('cash_registers')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'open')
        .order('opening_time', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setCurrentCashRegister(data || null);
    } catch (error: any) {
      showError(`Erro ao carregar status do caixa: ${error.message}`);
    }
  };

  const fetchTransactions = async () => {
    setIsLoading(true);
    let query = supabase
      .from('financial_transactions')
      .select('*, related_service_order_id, related_sale_id, related_pos_sale_id, cash_register_id')
      .eq('user_id', user?.id)
      .order('transaction_date', { ascending: false });

    if (currentCashRegister && currentCashRegister.status === 'open') {
      // If a cash register is open, filter transactions by its ID
      query = query.eq('cash_register_id', currentCashRegister.id);
    } else {
      // If no cash register is open, show transactions for the current month (as before)
      const today = new Date();
      const startDate = format(startOfMonth(today), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(today), 'yyyy-MM-dd');
      query = query
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);
    }

    if (transactionTypeFilter === 'service_order') {
      query = query.not('related_service_order_id', 'is', null);
    } else if (transactionTypeFilter === 'device_sale') {
      query = query.not('related_sale_id', 'is', null);
    } else if (transactionTypeFilter === 'pos_sale') {
      query = query.not('related_pos_sale_id', 'is', null);
    } else if (transactionTypeFilter === 'manual_income') {
      query = query
        .is('related_service_order_id', null)
        .is('related_sale_id', null)
        .is('related_pos_sale_id', null)
        .eq('type', 'income');
    } else if (transactionTypeFilter === 'manual_expense') { // New filter for manual expenses
      query = query
        .is('related_service_order_id', null)
        .is('related_sale_id', null)
        .is('related_pos_sale_id', null)
        .eq('type', 'expense');
    } else if (transactionTypeFilter === 'income') { // Filter for all income
      query = query.eq('type', 'income');
    } else if (transactionTypeFilter === 'expense') { // Filter for all expenses
      query = query.eq('type', 'expense');
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
            <CardTitle className="text-sm font-medium">Entradas (Caixa)</CardTitle>
            <ArrowUpCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">R$ {summary.income.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saídas (Caixa)</CardTitle>
            <ArrowDownCircle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">R$ {summary.expense.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo (Caixa)</CardTitle>
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
            <SelectItem value="income">Todas as Entradas</SelectItem>
            <SelectItem value="expense">Todas as Saídas</SelectItem>
            <SelectItem value="manual_income">Entradas Manuais</SelectItem>
            <SelectItem value="manual_expense">Saídas Manuais</SelectItem> {/* New filter option */}
            <SelectItem value="service_order">Ordens de Serviço</SelectItem>
            <SelectItem value="device_sale">Vendas de Aparelhos</SelectItem>
            <SelectItem value="pos_sale">Vendas PDV</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2 w-full sm:w-auto">
          <Dialog open={isIncomeFormOpen} onOpenChange={setIsIncomeFormOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto" disabled={!currentCashRegister || currentCashRegister.status !== 'open'}>
                <Plus className="mr-2 h-4 w-4" /> Adicionar Entrada
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><DollarSign className="h-6 w-6 text-primary" /> Nova Entrada Financeira</DialogTitle>
              </DialogHeader>
              <NewTransactionForm onSuccess={() => { fetchTransactions(); setIsIncomeFormOpen(false); }} currentCashRegisterId={currentCashRegister?.id} />
            </DialogContent>
          </Dialog>

          <Dialog open={isExpenseFormOpen} onOpenChange={setIsExpenseFormOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-red-600 hover:bg-red-700" disabled={!currentCashRegister || currentCashRegister.status !== 'open'}>
                <Minus className="mr-2 h-4 w-4" /> Adicionar Despesa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><DollarSign className="h-6 w-6 text-primary" /> Nova Despesa (Contas a Pagar)</DialogTitle>
              </DialogHeader>
              <NewExpenseForm onSuccess={() => { fetchTransactions(); setIsExpenseFormOpen(false); }} currentCashRegisterId={currentCashRegister?.id} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {(!currentCashRegister || currentCashRegister.status !== 'open') && (
        <div className="p-4 mb-4 text-center text-yellow-500 bg-yellow-500/10 border border-yellow-500 rounded-md">
          <p>O caixa está fechado. Abra o caixa para registrar novos lançamentos.</p>
        </div>
      )}

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
              <TableRow><TableCell colSpan={4} className="text-center"><Loader2 className="h-6 w-6 animate-spin inline-block mr-2" /> Carregando...</TableCell></TableRow>
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
              <TableRow><TableCell colSpan={4} className="text-center">Nenhum lançamento encontrado para o caixa atual ou filtros aplicados.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}