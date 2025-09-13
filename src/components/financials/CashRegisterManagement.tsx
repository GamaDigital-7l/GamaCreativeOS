import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Wallet, Lock, Unlock, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CashRegister {
  id: string;
  opening_time: string;
  closing_time: string | null;
  initial_balance: number;
  final_balance: number | null;
  status: 'open' | 'closed';
}

export function CashRegisterManagement({ onUpdate }: { onUpdate: () => void }) {
  const { user } = useSession();
  const [currentCashRegister, setCurrentCashRegister] = useState<CashRegister | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialBalance, setInitialBalance] = useState<string>('0.00');
  const [finalBalance, setFinalBalance] = useState<string>('0.00');
  const [currentBalance, setCurrentBalance] = useState<number>(0);

  useEffect(() => {
    if (user) {
      fetchCurrentCashRegister();
    }
  }, [user]);

  useEffect(() => {
    if (currentCashRegister && currentCashRegister.status === 'open') {
      fetchCurrentBalance(currentCashRegister.id);
    }
  }, [currentCashRegister]);

  const fetchCurrentCashRegister = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('cash_registers')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'open')
        .order('opening_time', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 means no rows found
      setCurrentCashRegister(data || null);
      setInitialBalance(data?.initial_balance.toFixed(2) || '0.00');
      setFinalBalance(data?.final_balance?.toFixed(2) || '0.00');
    } catch (error: any) {
      showError(`Erro ao carregar caixa: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCurrentBalance = async (cashRegisterId: string) => {
    try {
      const { data: transactions, error: transactionsError } = await supabase
        .from('financial_transactions')
        .select('amount, type')
        .eq('cash_register_id', cashRegisterId)
        .eq('user_id', user?.id);

      if (transactionsError) throw transactionsError;

      const calculatedBalance = transactions.reduce((acc, t) => {
        return t.type === 'income' ? acc + t.amount : acc - t.amount;
      }, currentCashRegister?.initial_balance || 0);

      setCurrentBalance(calculatedBalance);
      setFinalBalance(calculatedBalance.toFixed(2));
    } catch (error: any) {
      console.error("Erro ao calcular saldo atual:", error);
    }
  };

  const handleOpenCashRegister = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('cash_registers').insert({
        user_id: user.id,
        initial_balance: parseFloat(initialBalance),
        status: 'open',
      });
      if (error) throw error;
      showSuccess("Caixa aberto com sucesso!");
      fetchCurrentCashRegister();
      onUpdate();
    } catch (error: any) {
      showError(`Erro ao abrir caixa: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseCashRegister = async () => {
    if (!user || !currentCashRegister) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('cash_registers')
        .update({
          closing_time: new Date().toISOString(),
          final_balance: parseFloat(finalBalance),
          status: 'closed',
        })
        .eq('id', currentCashRegister.id)
        .eq('user_id', user.id);
      if (error) throw error;
      showSuccess("Caixa fechado com sucesso!");
      setCurrentCashRegister(null); // Clear current cash register
      onUpdate();
    } catch (error: any) {
      showError(`Erro ao fechar caixa: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Wallet className="h-6 w-6 text-primary" /> Gerenciamento de Caixa</CardTitle>
        <CardDescription>Abra e feche seu caixa diário para um controle financeiro preciso.</CardDescription>
      </CardHeader>
      <CardContent>
        {currentCashRegister && currentCashRegister.status === 'open' ? (
          <div className="space-y-4">
            <p className="text-lg font-semibold text-green-500 flex items-center gap-2">
              <Unlock className="h-5 w-5" /> Caixa Aberto
            </p>
            <p><strong>Aberto em:</strong> {format(new Date(currentCashRegister.opening_time), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
            <p><strong>Saldo Inicial:</strong> R$ {currentCashRegister.initial_balance.toFixed(2)}</p>
            <p className="text-xl font-bold flex items-center gap-2">
              <DollarSign className="h-6 w-6" /> Saldo Atual: R$ {currentBalance.toFixed(2)}
            </p>
            <div>
              <Label htmlFor="final-balance">Saldo Final (para fechamento)</Label>
              <Input
                id="final-balance"
                type="number"
                step="0.01"
                value={finalBalance}
                onChange={(e) => setFinalBalance(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button onClick={handleCloseCashRegister} disabled={isSubmitting} className="w-full bg-red-600 hover:bg-red-700">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Lock className="mr-2 h-4 w-4" /> Fechar Caixa
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-lg font-semibold text-red-500 flex items-center gap-2">
              <Lock className="h-5 w-5" /> Caixa Fechado
            </p>
            <div>
              <Label htmlFor="initial-balance">Saldo Inicial (para abertura)</Label>
              <Input
                id="initial-balance"
                type="number"
                step="0.01"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button onClick={handleOpenCashRegister} disabled={isSubmitting} className="w-full bg-green-600 hover:bg-green-700">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Unlock className="mr-2 h-4 w-4" /> Abrir Caixa
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}