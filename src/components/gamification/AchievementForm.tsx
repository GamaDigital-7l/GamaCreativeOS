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
import { Loader2, Save, PlusCircle, Trophy, Sparkles, Award } from "lucide-react";
import * as LucideIcons from 'lucide-react'; // Importa todos os ícones Lucide
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showSuccess, showError } from '@/utils/toast';

// Lista de ícones Lucide para seleção
const lucideIconNames = Object.keys(LucideIcons).filter(key => key !== 'createReactComponent' && key !== 'default');

const formSchema = z.object({
  name: z.string().min(2, "Nome da conquista é obrigatório."),
  description: z.string().min(10, "Descrição é obrigatória e deve ter pelo menos 10 caracteres."),
  icon_name: z.string().min(1, "Ícone é obrigatório."),
  points_reward: z.preprocess(
    (val) => Number(val || 0),
    z.number().int().min(0, "Pontos de recompensa não podem ser negativos.")
  ),
});

interface AchievementFormProps {
  achievementId?: string; // Optional for editing existing achievements
  onSuccess: () => void;
}

export function AchievementForm({ achievementId, onSuccess }: AchievementFormProps) {
  const { user } = useSession();
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      icon_name: "Award", // Default icon
      points_reward: 0,
    },
  });

  useEffect(() => {
    if (achievementId && user) {
      setIsLoadingData(true);
      supabase.from('gamification_achievements').select('*').eq('id', achievementId).single()
        .then(({ data, error }) => {
          if (error) {
            showError(`Erro ao carregar conquista: ${error.message}`);
          } else if (data) {
            form.reset(data);
          }
        })
        .finally(() => setIsLoadingData(false));
    }
  }, [achievementId, user, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      showError("Você precisa estar logado para gerenciar conquistas.");
      return;
    }
    setIsSubmitting(true);
    try {
      if (achievementId) {
        const { error } = await supabase.from('gamification_achievements').update(values).eq('id', achievementId);
        if (error) throw error;
        showSuccess("Conquista atualizada com sucesso!");
      } else {
        const { error } = await supabase.from('gamification_achievements').insert(values);
        if (error) throw error;
        showSuccess("Conquista criada com sucesso!");
      }
      onSuccess();
    } catch (error: any) {
      showError(`Erro ao salvar conquista: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingData) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const SelectedIcon = LucideIcons[form.watch('icon_name') as keyof typeof LucideIcons] || LucideIcons.Award;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Trophy className="h-6 w-6 text-primary" /> {achievementId ? "Editar Conquista" : "Nova Conquista"}</h2>
        
        <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome da Conquista</FormLabel><FormControl><Input placeholder="Ex: Mestre das Vendas" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea placeholder="Descreva o que é necessário para ganhar esta conquista..." {...field} /></FormControl><FormMessage /></FormItem>)} />
        
        <FormField control={form.control} name="icon_name" render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Ícone da Conquista</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger className="flex items-center gap-2">
                <SelectedIcon className="h-5 w-5" />
                <SelectValue placeholder="Selecione um ícone" />
              </SelectTrigger></FormControl>
              <SelectContent className="max-h-60 overflow-y-auto">
                {lucideIconNames.map((iconName) => {
                  const Icon = LucideIcons[iconName as keyof typeof LucideIcons] as React.ElementType;
                  return (
                    <SelectItem key={iconName} value={iconName} className="flex items-center gap-2">
                      <Icon className="h-5 w-5 mr-2" /> {iconName}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <FormDescription>Escolha um ícone que represente a conquista.</FormDescription>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="points_reward" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Award className="h-4 w-4" /> Pontos de Recompensa</FormLabel><FormControl><Input type="number" step="1" placeholder="100" {...field} /></FormControl><FormMessage /></FormItem>)} />
        
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : <><Save className="h-4 w-4 mr-2" /> Salvar Conquista</>}
        </Button>
      </form>
    </Form>
  );
}