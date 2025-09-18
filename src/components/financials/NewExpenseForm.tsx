import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2, Save, DollarSign, Tag, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useSession } from "@/integrations/supabase/SessionContext";

const formSchema = z.object({
  transaction_date: z.date({ required_error: "A data é obrigatória." }),
  description: z.string().min(3, "Descrição é obrigatória."),
  amount: z.preprocess(
    (val) => Number(String(val).replace(",", ".")),
    z.number().positive("O valor deve ser positivo.")
  ),
  category: z.string().optional(),
});

export function NewExpenseForm({ onSuccess, currentCashRegisterId }: { onSuccess: () => void; currentCashRegisterId?: string }) {
  const { user } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { transaction_date: new Date() },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      showError("Você precisa estar logado para adicionar uma despesa.");
      return;
    }
    if (!currentCashRegisterId) {
      showError("Nenhum caixa aberto. Por favor, abra o caixa primeiro para registrar despesas.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('financial_transactions').insert({
        ...values,
        user_id: user.id,
        transaction_date: format(values.transaction_date, 'yyyy-MM-dd'),
        type: 'expense', // Fixed type for expenses
        cash_register_id: currentCashRegisterId, // Associate with current cash register
      });
      if (error) throw error;
      showSuccess("Despesa salva!");
      onSuccess();
    } catch (error: any) {
      showError(`Erro ao salvar despesa: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><FileText className="h-4 w-4" /> Descrição da Despesa</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="amount" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Valor (R$)</FormLabel><FormControl><Input type="text" inputMode="decimal" placeholder="0,00" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="transaction_date" render={({ field }) => (
            <FormItem className="flex flex-col"><FormLabel className="flex items-center gap-2"><CalendarIcon className="h-4 w-4" /> Data</FormLabel><Popover>
              <PopoverTrigger asChild><FormControl>
                <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                  {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl></PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus /></PopoverContent>
            </Popover><FormMessage /></FormItem>
          )} />
        </div>
        <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Tag className="h-4 w-4" /> Categoria (Opcional)</FormLabel><FormControl><Input placeholder="Ex: Aluguel, Salário, Peças" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : <><Save className="mr-2 h-4 w-4" /> Salvar Despesa</>}
        </Button>
      </form>
    </Form>
  );
}