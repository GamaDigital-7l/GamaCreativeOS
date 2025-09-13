import React, { useEffect, useState } from "react";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/integrations/supabase/SessionContext";
import { showSuccess, showError } from "@/utils/toast";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, { message: "Nome do item é obrigatório." }),
  description: z.string().optional(),
  sku: z.string().optional(),
  quantity: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().int({ message: "Quantidade deve ser um número inteiro." }).min(0, { message: "Quantidade não pode ser negativa." })
  ),
  cost_price: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(0, { message: "Custo não pode ser negativo." })
  ),
  selling_price: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(0, { message: "Preço de venda não pode ser negativo." })
  ),
  supplier: z.string().optional(),
});

export function EditInventoryItemForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSession();
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!id) {
      showError("ID do item não fornecido.");
      navigate('/inventory');
      return;
    }

    const fetchItem = async () => {
      setIsLoadingData(true);
      try {
        const { data, error } = await supabase
          .from('inventory_items')
          .select(`*`)
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        form.reset(data);
      } catch (error: any) {
        showError(`Erro ao carregar dados: ${error.message}`);
        navigate('/inventory');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchItem();
  }, [id, user, navigate, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !id) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('inventory_items')
        .update({
          ...values,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      showSuccess("Item atualizado com sucesso!");
      navigate(`/inventory/${id}`);
    } catch (error: any) {
      showError(`Erro ao atualizar item: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
        <FormField name="name" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Nome do Item</FormLabel>
            <FormControl><Input {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField name="sku" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>SKU (Código de Barras)</FormLabel>
            <FormControl><Input {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField name="description" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Descrição</FormLabel>
            <FormControl><Textarea {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField name="quantity" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Quantidade em Estoque</FormLabel>
            <FormControl><Input type="number" min="0" step="1" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField name="cost_price" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Custo (R$)</FormLabel>
            <FormControl><Input type="number" min="0" step="0.01" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField name="selling_price" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Preço de Venda (R$)</FormLabel>
            <FormControl><Input type="number" min="0" step="0.01" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField name="supplier" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Fornecedor</FormLabel>
            <FormControl><Input {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Atualizando...</> : "Atualizar Item"}
        </Button>
      </form>
    </Form>
  );
}