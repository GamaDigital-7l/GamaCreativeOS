import React, { useEffect, useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2, Save, PlusCircle, Goal as GoalIcon, Scale, Clock, DollarSign } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formSchema = z.object({
  name: z.string().min(2, "Nome da meta é obrigatório."),
  description: z.string().optional(),
  metric: z.string().min(1, "Métrica é obrigatória."),
  target_value: z.preprocess(
    (val) => Number(String(val).replace(",", ".")),
    z.number().positive("Valor alvo deve ser positivo.")
  ),
  period: z.enum(["daily", "weekly", "monthly", "yearly", "total"], { required_error: "Período é obrigatório." }),
  start_date: z.date({ required_error: "Data de início é obrigatória." }),
  end_date: z.date({ required_error: "Data de fim é obrigatória." }),
  scope: z.enum(["user", "global"], { required_error: "Escopo é obrigatório." }),
  reward_description: z.string().optional(),
  is_active: z.boolean().default(true),
}).refine((data) => data.end_date >= data.start_date, {
  message: "A data de fim não pode ser anterior à data de início.",
  path: ["end_date"],
});

interface GoalFormProps {
  goalId?: string; // Optional for editing existing goals
  onSuccess: () => void;
}

export function GoalForm({ goalId, onSuccess }: GoalFormProps) {
  const { user } = useSession();
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      metric: "count",
      target_value: 0,
      period: "monthly",
      start_date: new Date(),
      end_date: new Date(),
      scope: "user",
      reward_description: "",
      is_active: true,
    },
  });

  useEffect(() => {
    if (goalId && user) {
      setIsLoadingData(true);
      supabase.from('gamification_goals').select('*').eq('id', goalId).eq('created_by', user.id).single()
        .then(({ data, error }) => {
          if (error) {
            showError(`Erro ao carregar meta: ${error.message}`);
          } else if (data) {
            form.reset({
              ...data,
              start_date: new Date(data.start_date),
              end_date: new Date(data.end_date),
            });
          }
        })
        .finally(() => setIsLoadingData(false));
    }
  }, [goalId, user, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      showError("Você precisa estar logado para gerenciar metas.");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        created_by: user.id,
        start_date: format(values.start_date, 'yyyy-MM-dd'),
        end_date: format(values.end_date, 'yyyy-MM-dd'),
      };

      if (goalId) {
        const { error } = await supabase.from('gamification_goals').update(payload).eq('id', goalId).eq('created_by', user.id);
        if (error) throw error;
        showSuccess("Meta atualizada com sucesso!");
      } else {
        const { error } = await supabase.from('gamification_goals').insert(payload);
        if (error) throw error;
        showSuccess("Meta criada com sucesso!");
      }
      onSuccess();
    } catch (error: any) {
      showError(`Erro ao salvar meta: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingData) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><GoalIcon className="h-6 w-6 text-primary" /> {goalId ? "Editar Meta" : "Nova Meta"}</h2>
        
        <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome da Meta</FormLabel><FormControl><Input placeholder="Ex: Vendas de Aparelhos" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descrição (Opcional)</FormLabel><FormControl><Textarea placeholder="Detalhes sobre como alcançar esta meta..." {...field} /></FormControl><FormMessage /></FormItem>)} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="metric" render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><Scale className="h-4 w-4" /> Métrica</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Selecione a métrica" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="count">Contagem (unidades)</SelectItem>
                  <SelectItem value="R$">Valor (R$)</SelectItem>
                  <SelectItem value="service_orders">Ordens de Serviço</SelectItem>
                  <SelectItem value="sales">Vendas de Aparelhos</SelectItem>
                  <SelectItem value="pos_sales">Vendas PDV</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="target_value" render={({ field }) => (<FormItem><FormLabel>Valor Alvo</FormLabel><FormControl><Input type="number" step="0.01" placeholder="100.00" {...field} /></FormControl><FormMessage /></FormItem>)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="period" render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><Clock className="h-4 w-4" /> Período</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Selecione o período" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                  <SelectItem value="total">Total (sempre)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="scope" render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><User className="h-4 w-4" /> Escopo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Selecione o escopo" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="user">Individual</SelectItem>
                  <SelectItem value="global">Global (para todos)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="start_date" render={({ field }) => (
            <FormItem className="flex flex-col"><FormLabel className="flex items-center gap-2"><CalendarIcon className="h-4 w-4" /> Data de Início</FormLabel><Popover>
              <PopoverTrigger asChild><FormControl>
                <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                  {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl></PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus /></PopoverContent>
            </Popover><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="end_date" render={({ field }) => (
            <FormItem className="flex flex-col"><FormLabel className="flex items-center gap-2"><CalendarIcon className="h-4 w-4" /> Data de Fim</FormLabel><Popover>
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

        <FormField control={form.control} name="reward_description" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Recompensa (Opcional)</FormLabel><FormControl><Input placeholder="Ex: +100 pontos, Medalha de Ouro" {...field} /></FormControl><FormMessage /></FormItem>)} />
        
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : <><Save className="h-4 w-4 mr-2" /> Salvar Meta</>}
        </Button>
      </form>
    </Form>
  );
}