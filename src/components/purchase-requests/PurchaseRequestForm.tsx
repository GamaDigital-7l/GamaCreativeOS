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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/integrations/supabase/SessionContext";
import { showSuccess, showError } from "@/utils/toast";
import { Loader2, Save, PlusCircle, ClipboardList, FileText } from "lucide-react";

const formSchema = z.object({
  inventory_item_id: z.string().uuid().optional().nullable(), // Agora opcional
  requested_quantity: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().int().min(1, "A quantidade deve ser pelo menos 1.").optional().nullable() // Agora opcional
  ),
  status: z.enum(["pending", "ordered", "received", "cancelled"], { required_error: "Selecione um status." }),
  notes: z.string().min(1, "A descrição do pedido é obrigatória."), // Tornando notes o campo principal e obrigatório
});

interface PurchaseRequestFormProps {
  requestId?: string; // Optional for editing existing requests
  onSuccess: () => void;
}

export function PurchaseRequestForm({ requestId, onSuccess }: PurchaseRequestFormProps) {
  const { user } = useSession();
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      inventory_item_id: null, // Definir como null por padrão
      requested_quantity: null, // Definir como null por padrão
      status: "pending",
      notes: "",
    },
  });

  useEffect(() => {
    if (requestId && user) {
      setIsLoadingData(true);
      supabase.from('purchase_requests').select('*').eq('id', requestId).eq('user_id', user.id).single()
        .then(({ data, error }) => {
          if (error) {
            showError(`Erro ao carregar pedido de compra: ${error.message}`);
          } else if (data) {
            form.reset(data);
          }
        })
        .finally(() => setIsLoadingData(false));
    }
  }, [requestId, user, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      showError("Você precisa estar logado para gerenciar pedidos de compra.");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        user_id: user.id,
      };

      if (requestId) {
        const { error } = await supabase.from('purchase_requests').update(payload).eq('id', requestId).eq('user_id', user.id);
        if (error) throw error;
        showSuccess("Pedido de compra atualizado com sucesso!");
      } else {
        const { error } = await supabase.from('purchase_requests').insert(payload);
        if (error) throw error;
        showSuccess("Pedido de compra criado com sucesso!");
      }
      onSuccess();
    } catch (error: any) {
      showError(`Erro ao salvar pedido de compra: ${error.message}`);
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
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><ClipboardList className="h-6 w-6 text-primary" /> {requestId ? "Editar Pedido de Compra" : "Novo Pedido de Compra"}</h2>
        
        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2"><FileText className="h-4 w-4" /> Descrição do Pedido</FormLabel>
            <FormControl><Textarea placeholder="Anote os detalhes do pedido aqui..." className="resize-y min-h-[120px]" {...field} /></FormControl>
            <FormDescription>
              Use este campo para registrar livremente o que precisa ser pedido.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="status" render={({ field }) => (
          <FormItem>
            <FormLabel>Status do Pedido</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Selecione o status" /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="ordered">Pedido</SelectItem>
                <SelectItem value="received">Recebido</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : <><Save className="h-4 w-4 mr-2" /> Salvar Pedido</>}
        </Button>
      </form>
    </Form>
  );
}