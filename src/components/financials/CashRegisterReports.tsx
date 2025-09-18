import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, CalendarDays, Search, DollarSign, ArrowUpCircle, ArrowDownCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, addMonths, subMonths, getMonth, getYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge'; // Import Badge
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CashRegisterReport {
  id: string;
  opening_time: string;
  closing_time: string | null;
  initial_balance: number;
  final_balance: number | null;
  status: 'open' | 'closed';
  financial_transactions: { amount: number; type: 'income' | 'expense' }[];
}

export function CashRegisterReports() {
  const { user } = useSession();
  const [cashRegisters, setCashRegisters] = useState<CashRegisterReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date()); // Estado para o mês atual
  const [viewMode, setViewMode] = useState<'monthly' | 'custom_range'>('monthly');
  const [customRangeStart, setCustomRangeStart] = useState<Date | undefined>(undefined);
  const [customRangeEnd, setCustomRangeEnd] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (user) {
      fetchCashRegisters();
    }
  }, [user, currentMonth, viewMode, customRangeStart, customRangeEnd]);

  const fetchCashRegisters = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('cash_registers')
        .select(`
          id,
          opening_time,
          closing_time,
          initial_balance,
          final_balance,
          status,
          financial_transactions(amount, type)
        `)
        .eq('user_id', user?.id)
        .order('opening_time', { ascending: false });

      let startDate: string | undefined;
      let endDate: string | undefined;

      if (viewMode === 'monthly') {
        startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd 00:00:00');
        endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd 23:59:59');
      } else if (viewMode === 'custom_range' && customRangeStart && customRangeEnd) {
        startDate = format(customRangeStart, 'yyyy-MM-dd 00:00:00');
        endDate = format(customRangeEnd, 'yyyy-MM-dd 23:59:59');
      }

      if (startDate && endDate) {
        query = query
          .gte('opening_time', startDate)
          .lte('opening_time', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      setCashRegisters(data || []);
    } catch (error: any) {
      showError(`Erro ao carregar relatórios de caixa: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateSummary = (cr: CashRegisterReport) => {
    const totalIncome = cr.financial_transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = cr.financial_transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const calculatedBalance = cr.initial_balance + totalIncome - totalExpense;
    return { totalIncome, totalExpense, calculatedBalance };
  };

  const totalSummaryForPeriod = cashRegisters.reduce((acc, cr) => {
    const { totalIncome, totalExpense } = calculateSummary(cr);
    acc.totalIncome += totalIncome;
    acc.totalExpense += totalExpense;
    acc.initialBalanceSum += cr.initial_balance;
    acc.finalBalanceSum += cr.final_balance !== null ? cr.final_balance : 0; // Sum final balance of closed registers
    return acc;
  }, { totalIncome: 0, totalExpense: 0, initialBalanceSum: 0, finalBalanceSum: 0 });

  const netBalanceForPeriod = totalSummaryForPeriod.totalIncome - totalSummaryForPeriod.totalExpense;

  const handleMonthChange = (amount: number) => {
    setCurrentMonth(prev => addMonths(prev, amount));
  };

  const handleMonthSelect = (date: Date | undefined) => {
    if (date) {
      setCurrentMonth(date);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CalendarDays className="h-6 w-6 text-primary" /> Relatórios de Caixa</CardTitle>
        <CardDescription>Visualize o histórico de abertura e fechamento de caixas e o resumo financeiro por período.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <Select value={viewMode} onValueChange={(value: 'monthly' | 'custom_range') => setViewMode(value)}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Modo de Visualização" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Mensal</SelectItem>
              <SelectItem value="custom_range">Período Personalizado</SelectItem>
            </SelectContent>
          </Select>

          {viewMode === 'monthly' && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" size="icon" onClick={() => handleMonthChange(-1)}><ChevronLeft className="h-4 w-4" /></Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full sm:w-[180px] justify-start text-left font-normal",
                      !currentMonth && "text-muted-foreground"
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {currentMonth ? format(currentMonth, "MMMM yyyy", { locale: ptBR }) : <span>Selecionar Mês</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    month={currentMonth}
                    onMonthChange={handleMonthSelect}
                    selected={currentMonth}
                    onSelect={handleMonthSelect}
                    initialFocus
                    captionLayout="dropdown-buttons"
                    fromYear={2000}
                    toYear={getYear(new Date()) + 5}
                  />
                </PopoverContent>
              </Popover>
              <Button variant="outline" size="icon" onClick={() => handleMonthChange(1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          )}

          {viewMode === 'custom_range' && (
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full sm:w-[180px] justify-start text-left font-normal",
                      !customRangeStart && "text-muted-foreground"
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {customRangeStart ? format(customRangeStart, "PPP", { locale: ptBR }) : <span>Data Início</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={customRangeStart}
                    onSelect={setCustomRangeStart}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full sm:w-[180px] justify-start text-left font-normal",
                      !customRangeEnd && "text-muted-foreground"
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {customRangeEnd ? format(customRangeEnd, "PPP", { locale: ptBR }) : <span>Data Fim</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={customRangeEnd}
                    onSelect={setCustomRangeEnd}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <>
            {/* Resumo Financeiro do Período */}
            <Card className="mb-6 border-l-4 border-primary">
              <CardHeader>
                <CardTitle className="text-xl">Resumo do Período</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <ArrowUpCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Entradas</p>
                    <p className="font-bold text-lg text-green-500">R$ {totalSummaryForPeriod.totalIncome.toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowDownCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Saídas</p>
                    <p className="font-bold text-lg text-red-500">R$ {totalSummaryForPeriod.totalExpense.toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo Líquido</p>
                    <p className={`font-bold text-lg ${netBalanceForPeriod >= 0 ? 'text-blue-500' : 'text-red-500'}`}>R$ {netBalanceForPeriod.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {cashRegisters.length === 0 ? (
              <p className="text-center text-muted-foreground">Nenhum caixa encontrado para o período selecionado.</p>
            ) : (
              <div className="space-y-6">
                {cashRegisters.map((cr) => {
                  const { totalIncome, totalExpense, calculatedBalance } = calculateSummary(cr);
                  return (
                    <Card key={cr.id} className="border-primary/20">
                      <CardHeader className="bg-muted/30 rounded-t-lg">
                        <CardTitle className="text-lg flex justify-between items-center">
                          Caixa de {format(new Date(cr.opening_time), 'dd/MM/yyyy', { locale: ptBR })}
                          <Badge variant={cr.status === 'open' ? 'default' : 'secondary'}>
                            {cr.status === 'open' ? 'Aberto' : 'Fechado'}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          Aberto: {format(new Date(cr.opening_time), 'HH:mm', { locale: ptBR })}
                          {cr.closing_time && ` | Fechado: ${format(new Date(cr.closing_time), 'HH:mm', { locale: ptBR })}`}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Saldo Inicial</p>
                            <p className="font-semibold">R$ {cr.initial_balance.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Saldo Final Registrado</p>
                            <p className="font-semibold">R$ {(cr.final_balance || 0).toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 border-t pt-3 mt-3">
                          <div className="flex items-center gap-1 text-green-500">
                            <ArrowUpCircle className="h-4 w-4" />
                            <p className="text-sm">Entradas: <span className="font-semibold">R$ {totalIncome.toFixed(2)}</span></p>
                          </div>
                          <div className="flex items-center gap-1 text-red-500">
                            <ArrowDownCircle className="h-4 w-4" />
                            <p className="text-sm">Saídas: <span className="font-semibold">R$ {totalExpense.toFixed(2)}</span></p>
                          </div>
                          <div className="flex items-center gap-1 text-blue-500">
                            <DollarSign className="h-4 w-4" />
                            <p className="text-sm">Saldo Calculado: <span className="font-bold">R$ {calculatedBalance.toFixed(2)}</span></p>
                          </div>
                        </div>
                        {/* Optionally, display individual transactions for this cash register */}
                        {cr.financial_transactions.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-semibold text-md mb-2">Lançamentos do Caixa:</h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Descrição</TableHead>
                                  <TableHead>Tipo</TableHead>
                                  <TableHead className="text-right">Valor</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {cr.financial_transactions.map((t, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell className="text-sm">{t.amount}</TableCell>
                                    <TableCell className="text-sm">{t.type === 'income' ? 'Entrada' : 'Saída'}</TableCell>
                                    <TableCell className={`text-right text-sm ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                      {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}