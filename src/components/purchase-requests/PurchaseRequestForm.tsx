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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/integrations/supabase/SessionContext";
import { showSuccess, showError } from "@/utils/toast";
import { Loader2, Save, PlusCircle, Package, Check, ChevronsUpDown, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  inventory_item_id: z.string().uuid({ message: "Selecione um item de estoque válido." }),
  requested_quantity: z.preprocess(
    (val) => Number(val),
    z.number().int().min(1, "A quantidade deve ser pelo menos 1.")
  ),
  status: z.enum(["pending", "ordered", "received", "cancelled"], { required_error: "Selecione um status." }),
  notes: z.string().optional(),
});

interface InventoryItemOption {
  id: string;
  name: string;
  quantity: number; // Current stock quantity
}

interface PurchaseRequestFormProps {
  requestId?: string; // Optional for editing existing requests
  onSuccess: () => void;
}

export function PurchaseRequestForm({ requestId, onSuccess }: PurchaseRequestFormProps) {
  const { user } = useSession();
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inventoryOptions, setInventoryOptions] = useState<InventoryItemOption[]>([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      inventory_item_id: "",
      requested_quantity: 1,
      status: "pending",
      notes: "",
    },
  });

  useEffect(() => {
    if (!user) return;

    const fetchInventory = async () => {
      setIsLoadingInventory(true);
      try {
        const { data, error } = await supabase
          .from('inventory_items')
          .select('id, name, quantity')
          .eq('user_id', user.id)
          .order('name', { ascending: true });
        if (error) throw error;
        setInventoryOptions(data || []);
      } catch (error: any) {
        showError(`Erro ao carregar itens de estoque: ${error.message}`);
      } finally {
        setIsLoadingInventory(false);
      }
    };

    fetchInventory();
  }, [user]);

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

  if (isLoadingData || isLoadingInventory) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><PlusCircle className="h-6 w-6 text-primary" /> {requestId ? "Editar Pedido de Compra" : "Novo Pedido de Compra"}</h2>
        
        <FormField control={form.control} name="inventory_item_id" render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel className="flex items-center gap-2"><Package className="h-4 w-4" /> Item de Estoque</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                  >
                    {field.value
                      ? inventoryOptions.find((option) => option.id === field.value)?.name
                      : "Selecione um item"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Buscar item..." />
                  <CommandList>
                    <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
                    <CommandGroup>
                      {inventoryOptions.map((option) => (
                        <CommandItem
                          value={option.name}
                          key={option.id}
                          onSelect={() => {
                            field.onChange(option.id);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              option.id === field.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {option.name} (Qtd atual: {option.quantity})
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <FormDescription>
              Selecione o item do seu estoque que precisa ser pedido.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="requested_quantity" render={({ field }) => (
          <FormItem>
            <FormLabel>Quantidade Solicitada</FormLabel>
            <FormControl><Input type="number" min="1" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl>
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

        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2"><FileText className="h-4 w-4" /> Observações (Opcional)</FormLabel>
            <FormControl><Textarea placeholder="Detalhes adicionais sobre o pedido..." {...field} /></FormControl>
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