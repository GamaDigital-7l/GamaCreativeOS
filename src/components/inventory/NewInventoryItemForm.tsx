import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form"; // Import useFieldArray
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
import { Loader2, PlusCircle, Package, Tag, Hash, DollarSign, Factory, FileText, Image as ImageIcon, Trash2 } from "lucide-react"; // Adicionado Trash2
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
  category: z.string().optional(),
  image_urls: z.array(z.string().url({ message: "URL de imagem inválida." }).or(z.literal(''))).max(5, "Máximo de 5 imagens.").optional(), // Alterado para array
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
      category: "",
      image_urls: [], // Default para array vazio
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "image_urls",
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
          sku: values.sku || null,
          category: values.category || null,
          image_urls: values.image_urls?.filter(url => url) || null, // Filtrar URLs vazias
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
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Package className="h-6 w-6 text-primary" /> Detalhes do Item</h2>
        <FormField name="name" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2"><Tag className="h-4 w-4" /> Nome do Item</FormLabel>
            <FormControl><Input placeholder="Ex: Tela iPhone 11" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField name="sku" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2"><Hash className="h-4 w-4" /> SKU (Código de Barras)</FormLabel>
            <FormControl><Input placeholder="Opcional" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField name="description" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2"><FileText className="h-4 w-4" /> Descrição</FormLabel>
            <FormControl><Textarea placeholder="Detalhes sobre o item..." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField name="category" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2"><Tag className="h-4 w-4" /> Categoria</FormLabel>
            <FormControl><Input placeholder="Ex: Telas, Baterias, Acessórios" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        
        <h3 className="text-xl font-bold mt-8 mb-4 flex items-center gap-2"><ImageIcon className="h-5 w-5 text-primary" /> Imagens do Produto (Máx. 5)</h3>
        <div className="space-y-2">
          {fields.map((field, index) => (
            <FormField
              key={field.id}
              control={form.control}
              name={`image_urls.${index}`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">URL da Imagem {index + 1}</FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input placeholder="https://exemplo.com/imagem.jpg" {...field} />
                    </FormControl>
                    <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
          {fields.length < 5 && (
            <Button type="button" variant="outline" onClick={() => append("")} className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Imagem
            </Button>
          )}
        </div>

        <FormField name="quantity" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2"><Package className="h-4 w-4" /> Quantidade em Estoque</FormLabel>
            <FormControl><Input type="number" min="0" step="1" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField name="cost_price" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Custo (R$)</FormLabel>
            <FormControl><Input type="number" min="0" step="0.01" placeholder="0.00" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField name="selling_price" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Preço de Venda (R$)</FormLabel>
            <FormControl><Input type="number" min="0" step="0.01" placeholder="0.00" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField name="supplier" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2"><Factory className="h-4 w-4" /> Fornecedor</FormLabel>
            <FormControl><Input placeholder="Opcional" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando...</> : <><PlusCircle className="h-4 w-4 mr-2" /> Criar Item</>}
        </Button>
      </form>
    </Form>
  );
}