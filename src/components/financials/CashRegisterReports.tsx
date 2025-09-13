import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, CalendarDays, Search, DollarSign, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge'; // Import Badge

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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (user) {
      fetchCashRegisters();
    }
  }, [user, selectedDate]);

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

      if (selectedDate) {
        const startOfDay = format(selectedDate, 'yyyy-MM-dd 00:00:00');
        const endOfDay = format(selectedDate, 'yyyy-MM-dd 23:59:59');
        query = query
          .gte('opening_time', startOfDay)
          .lte('opening_time', endOfDay);
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

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CalendarDays className="h-6 w-6 text-primary" /> Relatórios de Caixa</CardTitle>
        <CardDescription>Visualize o histórico de abertura e fechamento de caixas.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full sm:w-[280px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : <span>Selecionar data</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {selectedDate && (
            <Button variant="ghost" onClick={() => setSelectedDate(undefined)}>
              <X className="h-4 w-4 mr-2" /> Limpar Filtro
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : cashRegisters.length === 0 ? (
          <p className="text-center text-muted-foreground">Nenhum caixa encontrado para a data selecionada.</p>
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
      </CardContent>
    </Card>
  );
}