"use client";

import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/integrations/supabase/SessionContext";
import { showSuccess, showError } from "@/utils/toast";
import { Loader2, Save, PlusCircle, Trash2, Settings, List, Type, CheckSquare, ListPlus } from "lucide-react";

const formSchema = z.object({
  field_name: z.string().min(2, "Nome do campo é obrigatório."),
  field_type: z.enum(["text", "textarea", "select", "checkbox"], { required_error: "Tipo de campo é obrigatório." }),
  is_required: z.boolean().default(false),
  options: z.array(z.object({
    value: z.string().min(1, "Opção não pode ser vazia."),
  })).optional(),
  order_index: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().int().min(0, "Índice deve ser um número positivo.").optional()
  ),
});

interface CustomFieldFormProps {
  fieldId?: string; // Optional for editing existing fields
  onSuccess: () => void;
}

export function CustomFieldForm({ fieldId, onSuccess }: CustomFieldFormProps) {
  const { user } = useSession();
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      field_name: "",
      field_type: "text",
      is_required: false,
      options: [],
      order_index: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options",
  });

  const watchedFieldType = form.watch("field_type");

  useEffect(() => {
    if (fieldId && user) {
      setIsLoadingData(true);
      supabase.from('service_order_custom_fields').select('*').eq('id', fieldId).eq('user_id', user.id).single()
        .then(({ data, error }) => {
          if (error) {
            showError(`Erro ao carregar campo: ${error.message}`);
          } else if (data) {
            form.reset({
              ...data,
              options: data.options ? data.options.map((opt: string) => ({ value: opt })) : [],
            });
          }
        })
        .finally(() => setIsLoadingData(false));
    }
  }, [fieldId, user, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      showError("Você precisa estar logado para gerenciar campos personalizados.");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        user_id: user.id,
        field_name: values.field_name,
        field_type: values.field_type,
        is_required: values.is_required,
        options: values.options?.map(opt => opt.value) || null,
        order_index: values.order_index || 0,
      };

      if (fieldId) {
        const { error } = await supabase.from('service_order_custom_fields').update(payload).eq('id', fieldId).eq('user_id', user.id);
        if (error) throw error;
        showSuccess("Campo personalizado atualizado com sucesso!");
      } else {
        const { error } = await supabase.from('service_order_custom_fields').insert(payload);
        if (error) throw error;
        showSuccess("Campo personalizado criado com sucesso!");
      }
      onSuccess();
    } catch (error: any) {
      showError(`Erro ao salvar campo: ${error.message}`);
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
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Settings className="h-6 w-6 text-primary" /> {fieldId ? "Editar Campo Personalizado" : "Novo Campo Personalizado"}</h2>
        
        <FormField control={form.control} name="field_name" render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2"><List className="h-4 w-4" /> Nome do Campo</FormLabel>
            <FormControl><Input placeholder="Ex: Defeito Detalhado, Reclamação do Cliente" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="field_type" render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2"><Type className="h-4 w-4" /> Tipo de Campo</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Selecione o tipo de campo" /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="text">Texto Curto</SelectItem>
                <SelectItem value="textarea">Texto Longo</SelectItem>
                <SelectItem value="select">Seleção Única (Dropdown)</SelectItem>
                <SelectItem value="checkbox">Múltipla Escolha (Checkbox)</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              O tipo de campo define como o dado será inserido e exibido.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )} />

        {(watchedFieldType === "select" || watchedFieldType === "checkbox") && (
          <div className="space-y-4 border p-4 rounded-lg">
            <h3 className="text-xl font-bold flex items-center gap-2"><ListPlus className="h-5 w-5 text-primary" /> Opções do Campo</h3>
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <FormField
                  control={form.control}
                  name={`options.${index}.value`}
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormLabel className="sr-only">Opção {index + 1}</FormLabel>
                      <FormControl><Input placeholder={`Opção ${index + 1}`} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => append({ value: "" })} className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Opção
            </Button>
          </div>
        )}

        <FormField control={form.control} name="is_required" render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel className="flex items-center gap-2"><CheckSquare className="h-4 w-4" /> Campo Obrigatório</FormLabel>
              <FormDescription>
                Marque se este campo deve ser preenchido obrigatoriamente.
              </FormDescription>
            </div>
          </FormItem>
        )} />

        <FormField control={form.control} name="order_index" render={({ field }) => (
          <FormItem>
            <FormLabel>Ordem de Exibição (Opcional)</FormLabel>
            <FormControl><Input type="number" placeholder="0" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl>
            <FormDescription>
              Define a ordem em que o campo aparecerá na Ordem de Serviço.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )} />
        
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : <><Save className="h-4 w-4 mr-2" /> Salvar Campo</>}
        </Button>
      </form>
    </Form>
  );
}