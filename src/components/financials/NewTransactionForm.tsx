import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2, Save, DollarSign, Tag, FileText } from "lucide-react"; // Adicionado FileText icon
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
  type: z.enum(["income", "expense"], { required_error: "Selecione o tipo." }),
  category: z.string().optional(),
});

export function NewTransactionForm({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { transaction_date: new Date(), type: "expense" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      showError("Você precisa estar logado para adicionar um lançamento.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('financial_transactions').insert({
        ...values,
        user_id: user.id,
        transaction_date: format(values.transaction_date, 'yyyy-MM-dd'),
      });
      if (error) throw error;
      showSuccess("Lançamento salvo!");
      onSuccess();
    } catch (error: any) {
      showError(`Erro: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <FormField control={form.control} name="type" render={({ field }) => (
          <FormItem className="space-y-3"><FormControl>
            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex justify-center gap-4">
              <FormItem><FormControl><RadioGroupItem value="expense" id="expense" className="sr-only peer" /></FormControl><Label htmlFor="expense" className="peer-aria-checked:bg-red-100 peer-aria-checked:text-red-900 peer-aria-checked:border-red-300 border-2 rounded-md p-2 px-4 cursor-pointer flex items-center gap-2"><DollarSign className="h-4 w-4" /> Saída</Label></FormItem>
              <FormItem><FormControl><RadioGroupItem value="income" id="income" className="sr-only peer" /></FormControl><Label htmlFor="income" className="peer-aria-checked:bg-green-100 peer-aria-checked:text-green-900 peer-aria-checked:border-green-300 border-2 rounded-md p-2 px-4 cursor-pointer flex items-center gap-2"><DollarSign className="h-4 w-4" /> Entrada</Label></FormItem>
            </RadioGroup>
          </FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><FileText className="h-4 w-4" /> Descrição</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
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
        <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Tag className="h-4 w-4" /> Categoria (Opcional)</FormLabel><FormControl><Input placeholder="Ex: Peças, Salário" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : <><Save className="mr-2 h-4 w-4" /> Salvar Lançamento</>}
        </Button>
      </form>
    </Form>
  );
}