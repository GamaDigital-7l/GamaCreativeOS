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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/integrations/supabase/SessionContext";
import { showSuccess, showError } from "@/utils/toast";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, Check, ChevronsUpDown, PlusCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PaymentDialog } from "./PaymentDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const serviceOrderStatuses = ["pending", "in_progress", "ready", "completed", "cancelled"];

const formSchema = z.object({
  issueDescription: z.string().optional(),
  serviceDetails: z.string().optional(),
  partsCost: z.preprocess((val) => Number(val || 0), z.number().min(0).optional()),
  serviceCost: z.preprocess((val) => Number(val || 0), z.number().min(0).optional()),
  totalAmount: z.preprocess((val) => Number(val || 0), z.number().min(0).optional()),
  guaranteeTerms: z.string().optional(),
  warranty_days: z.preprocess((val) => Number(val || 0), z.number().int().min(0).optional()),
  status: z.enum(["pending", "in_progress", "ready", "completed", "cancelled"]),
  inventoryItems: z.array(z.object({
    inventory_item_id: z.string(),
    name: z.string(),
    quantity_used: z.preprocess((val) => Number(val || 1), z.number().int().min(1)),
    cost_at_time: z.number(),
    price_at_time: z.number(),
  })).optional(),
});

type InventoryItemOption = {
  id: string;
  name: string;
  quantity: number;
  cost_price: number;
  selling_price: number;
};

export function EditServiceOrderForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSession();
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inventoryOptions, setInventoryOptions] = useState<InventoryItemOption[]>([]);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [serviceOrderData, setServiceOrderData] = useState<any>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      issueDescription: "", serviceDetails: "",
      partsCost: 0, serviceCost: 0, totalAmount: 0, guaranteeTerms: "", warranty_days: 90,
      status: "pending", inventoryItems: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "inventoryItems",
  });

  const watchedItems = form.watch("inventoryItems");
  const watchedServiceCost = form.watch("serviceCost");
  const watchedStatus = form.watch("status");
  const watchedTotalAmount = form.watch("totalAmount");

  useEffect(() => {
    const newPartsCost = watchedItems?.reduce((total, item) => total + (item.price_at_time * item.quantity_used), 0) || 0;
    form.setValue("partsCost", newPartsCost);
    form.setValue("totalAmount", newPartsCost + (watchedServiceCost || 0));
  }, [watchedItems, watchedServiceCost, form]);

  useEffect(() => {
    if (!user || !id) return;

    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        const { data: settingsData } = await supabase.from("user_settings").select("default_guarantee_terms").eq("id", user.id).single();
        const { data: inventoryData } = await supabase.from('inventory_items').select('id, name, quantity, cost_price, selling_price').eq('user_id', user.id);
        setInventoryOptions(inventoryData || []);

        const { data, error } = await supabase.from('service_orders').select(`*, customers(name), service_order_inventory_items (*, inventory_items(name))`).eq('id', id).single();
        if (error) throw error;
        
        setServiceOrderData(data);

        form.reset({
          issueDescription: data.issue_description || "", serviceDetails: data.service_details || "",
          partsCost: data.parts_cost || 0, serviceCost: data.service_cost || 0,
          totalAmount: data.total_amount || 0, 
          guaranteeTerms: data.guarantee_terms || settingsData?.default_guarantee_terms || "",
          warranty_days: data.warranty_days || 90,
          status: data.status as any,
          inventoryItems: data.service_order_inventory_items.map((item: any) => ({
            inventory_item_id: item.inventory_item_id,
            name: item.inventory_items?.name || 'Item Removido',
            quantity_used: item.quantity_used,
            cost_at_time: item.cost_at_time,
            price_at_time: item.price_at_time,
          })),
        });
      } catch (err: any) {
        showError(`Erro ao carregar dados: ${err.message}`);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchData();
  }, [id, user, form]);

  const handleAddInventoryItem = (itemId: string) => {
    const item = inventoryOptions.find(i => i.id === itemId);
    if (item) {
      append({
        inventory_item_id: item.id, name: item.name, quantity_used: 1,
        cost_at_time: item.cost_price, price_at_time: item.selling_price,
      });
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>, shouldNavigate = true) {
    if (!user || !id) return;
    setIsSubmitting(true);
    try {
      await supabase.from('service_order_inventory_items').delete().eq('service_order_id', id);
      if (values.inventoryItems && values.inventoryItems.length > 0) {
        const itemsToInsert = values.inventoryItems.map(item => ({
          service_order_id: id, inventory_item_id: item.inventory_item_id, user_id: user.id,
          quantity_used: item.quantity_used, cost_at_time: item.cost_at_time, price_at_time: item.price_at_time,
        }));
        await supabase.from('service_order_inventory_items').insert(itemsToInsert);
      }

      await supabase.from('service_orders').update({
        issue_description: values.issueDescription, service_details: values.serviceDetails,
        parts_cost: values.partsCost, service_cost: values.serviceCost, total_amount: values.totalAmount,
        guarantee_terms: values.guaranteeTerms, warranty_days: values.warranty_days,
        status: values.status, updated_at: new Date().toISOString(),
      }).eq('id', id);

      showSuccess("Ordem de Serviço atualizada!");
      if (shouldNavigate) {
        navigate(`/service-orders/${id}`);
      }
    } catch (error: any) {
      showError(`Erro ao atualizar: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleFinalizePayment = async (paymentMethod: string) => {
    if (!user || !id || !serviceOrderData) return;
    
    await form.handleSubmit((values) => onSubmit(values, false))();
    
    if (!form.formState.isValid) {
        showError("Por favor, corrija os erros no formulário antes de finalizar.");
        return;
    }

    try {
      const { error: osError } = await supabase.from('service_orders').update({
        status: 'completed', payment_method: paymentMethod, payment_status: 'paid',
        finalized_at: new Date().toISOString(),
      }).eq('id', id);
      if (osError) throw osError;

      const description = `Recebimento OS #${id.substring(0, 8)} - Cliente: ${serviceOrderData.customers.name}`;
      const { error: transactionError } = await supabase
        .from('financial_transactions')
        .insert({
          user_id: user.id,
          transaction_date: new Date().toISOString(),
          description: description,
          amount: form.getValues('totalAmount'),
          type: 'income',
          category: 'Recebimento de Serviço',
          related_service_order_id: id,
        });

      if (transactionError) {
        showError(`OS finalizada, mas falha ao registrar no financeiro: ${transactionError.message}`);
      } else {
        showSuccess("Pagamento registrado e OS concluída!");
      }
      
      setIsPaymentDialogOpen(false);
      navigate(`/service-orders/${id}`);
    } catch (error: any) {
      showError(`Erro ao finalizar pagamento: ${error.message}`);
    }
  };

  if (isLoadingData) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <>
      <PaymentDialog isOpen={isPaymentDialogOpen} onClose={() => setIsPaymentDialogOpen(false)} onSubmit={handleFinalizePayment} totalAmount={watchedTotalAmount || 0} />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 p-4">
          {/* Fields for issue description, service details, etc. */}
          <h2 className="text-2xl font-bold mt-8 mb-4">Peças e Materiais Utilizados</h2>
          {/* Inventory fields */}
          <h2 className="text-2xl font-bold mt-8 mb-4">Detalhes e Custos do Serviço</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="serviceCost" render={({ field }) => (<FormItem><FormLabel>Custo da Mão de Obra (R$)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="partsCost" render={({ field }) => (<FormItem><FormLabel>Custo das Peças (R$)</FormLabel><FormControl><Input type="number" readOnly disabled {...field} /></FormControl><FormMessage /></FormItem>)} />
          </div>
          <div className="text-right font-bold text-xl">Total: R$ {watchedTotalAmount?.toFixed(2)}</div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="warranty_days" render={({ field }) => (<FormItem><FormLabel>Garantia (dias)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status da OS</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{serviceOrderStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
          </div>
          <FormField control={form.control} name="guaranteeTerms" render={({ field }) => (<FormItem><FormLabel>Termos de Garantia</FormLabel><FormControl><Textarea className="min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>)} />

          <div className="flex justify-between items-center pt-4 border-t">
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : "Salvar Alterações"}</Button>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-block">
                    <Button 
                      type="button" 
                      onClick={() => setIsPaymentDialogOpen(true)} 
                      className="bg-green-600 hover:bg-green-700"
                      disabled={watchedStatus !== 'ready'}
                    >
                      Finalizar e Registrar Pagamento
                    </Button>
                  </div>
                </TooltipTrigger>
                {watchedStatus !== 'ready' && (
                  <TooltipContent>
                    <p>Mude o status para "Pronto" para habilitar a finalização.</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

          </div>
        </form>
      </Form>
    </>
  );
}