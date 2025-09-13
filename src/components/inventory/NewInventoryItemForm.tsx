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
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import React, { useState } from "react";

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

export function NewInventoryItemForm() {
  const { user } = useSession();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      sku: "",
      quantity: 0,
      cost_price: 0,
      selling_price: 0,
      supplier: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      showError("Você precisa estar logado para criar um item.");
      navigate('/login');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('inventory_items')
        .insert({
          ...values,
          sku: values.sku || null, // Treat empty string as null
          user_id: user.id,
        });

      if (error) throw error;

      showSuccess("Item criado com sucesso!");
      form.reset();
      navigate('/inventory');
    } catch (error: any) {
      showError(`Erro ao criar item: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
        <FormField name="name" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Nome do Item</FormLabel>
            <FormControl><Input placeholder="Ex: Tela iPhone 11" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField name="sku" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>SKU (Código de Barras)</FormLabel>
            <FormControl><Input placeholder="Opcional" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField name="description" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Descrição</FormLabel>
            <FormControl><Textarea placeholder="Detalhes sobre o item..." {...field} /></FormControl>
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
            <FormControl><Input type="number" min="0" step="0.01" placeholder="0.00" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField name="selling_price" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Preço de Venda (R$)</FormLabel>
            <FormControl><Input type="number" min="0" step="0.01" placeholder="0.00" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField name="supplier" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Fornecedor</FormLabel>
            <FormControl><Input placeholder="Opcional" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando...</> : "Criar Item"}
        </Button>
      </form>
    </Form>
  );
}