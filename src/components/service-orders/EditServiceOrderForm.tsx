import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, Controller } from "react-hook-form";
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
import { Loader2, Check, ChevronsUpDown, PlusCircle, Trash2, DollarSign, Wrench, Package, CalendarDays, Save, List, Type, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import { PaymentDialog } from "./PaymentDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { ClientChecklistInput } from "./ClientChecklistInput"; // Import new component

const serviceOrderStatuses = ["pending", "in_progress", "ready", "completed", "cancelled"];

const clientChecklistOptions = [
  "Tela", "Bateria", "Conector", "Touch", "Câmera Frontal",
  "Câmera Traseira", "Face ID / Biometria", "Conector de Carga",
  "Botões Volume", "Botão Power", "Rede", "Wi-Fi", "Bluetooth",
];

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
  clientChecklist: z.record(z.enum(['ok', 'not_working'])).optional(),
  isUntestable: z.boolean().default(false),
  casing_status: z.enum(['good', 'scratched', 'damaged']).optional().nullable(), // New field
  customFields: z.record(z.union([z.string(), z.array(z.string())])).optional(),
}).superRefine((data, ctx) => {
  // Custom field validation
  if (data.customFields) {
    Object.entries(data.customFields).forEach(([fieldId, value]) => {
      const customFieldDef = (ctx as any)._root.customFieldDefinitions?.find((f: any) => f.id === fieldId);
      if (customFieldDef?.is_required) {
        if (typeof value === 'string' && !value.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${customFieldDef.field_name} é obrigatório.`,
            path: [`customFields.${fieldId}`],
          });
        } else if (Array.isArray(value) && value.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${customFieldDef.field_name} é obrigatório.`,
            path: [`customFields.${fieldId}`],
          });
        }
      }
    });
  }
});

type InventoryItemOption = {
  id: string;
  name: string;
  quantity: number;
  cost_price: number;
  selling_price: number;
};

interface CustomFieldDefinition {
  id: string;
  field_name: string;
  field_type: 'text' | 'textarea' | 'select' | 'checkbox';
  is_required: boolean;
  options?: string[];
  order_index: number;
}

export function EditServiceOrderForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSession();
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inventoryOptions, setInventoryOptions] = useState<InventoryItemOption[]>([]);
  const [customFieldDefinitions, setCustomFieldDefinitions] = useState<CustomFieldDefinition[]>([]);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [serviceOrderData, setServiceOrderData] = useState<any>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      issueDescription: "", serviceDetails: "",
      partsCost: 0, serviceCost: 0, totalAmount: 0, guaranteeTerms: "", warranty_days: 90,
      status: "pending", inventoryItems: [],
      clientChecklist: {},
      isUntestable: false,
      casing_status: null, // Initialize new field
      customFields: {},
    },
    context: { customFieldDefinitions },
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

        // Fetch custom field definitions
        const { data: customFieldsDefData, error: customFieldsDefError } = await supabase
          .from('service_order_custom_fields')
          .select('*')
          .eq('user_id', user.id)
          .order('order_index', { ascending: true });
        if (customFieldsDefError) {
          showError(`Erro ao carregar definições de campos personalizados: ${customFieldsDefError.message}`);
        } else {
          setCustomFieldDefinitions(customFieldsDefData || []);
        }

        const { data, error } = await supabase.from('service_orders').select(`*, customers(name), service_order_inventory_items (*, inventory_items(name)), service_order_field_values(*)`).eq('id', id).single();
        if (error) throw error;
        
        setServiceOrderData(data);

        // Map existing custom field values
        const initialCustomFieldValues: Record<string, string | string[]> = {};
        customFieldsDefData?.forEach(fieldDef => {
          const valuesForField = data.service_order_field_values
            .filter((fv: any) => fv.custom_field_id === fieldDef.id)
            .map((fv: any) => fv.value);
          
          if (fieldDef.field_type === 'checkbox') {
            initialCustomFieldValues[fieldDef.id] = valuesForField;
          } else {
            initialCustomFieldValues[fieldDef.id] = valuesForField[0] || '';
          }
        });

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
            cost_at_time: item.cost_at_time,
            price_at_time: item.price_at_time,
            quantity_used: item.quantity_used,
          })),
          clientChecklist: data.client_checklist || {},
          isUntestable: data.is_untestable || false,
          casing_status: data.casing_status || null, // Load new field
          customFields: initialCustomFieldValues,
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
      // Fetch current items to determine stock changes
      const { data: existingItemsData, error: existingItemsError } = await supabase
        .from('service_order_inventory_items')
        .select('inventory_item_id, quantity_used')
        .eq('service_order_id', id);

      if (existingItemsError) throw existingItemsError;

      const existingItemsMap = new Map(existingItemsData.map(item => [item.inventory_item_id, item.quantity_used]));
      const newItemsMap = new Map((values.inventoryItems || []).map(item => [item.inventory_item_id, item.quantity_used]));

      // Revert stock for removed/reduced items
      const stockRevertPromises = Array.from(existingItemsMap.entries()).map(([itemId, oldQuantity]) => {
        const newQuantity = newItemsMap.get(itemId) || 0;
        if (oldQuantity > newQuantity) {
          const diff = oldQuantity - newQuantity;
          return supabase.rpc('increment_quantity', { item_id: itemId, amount: diff });
        }
        return null;
      }).filter(Boolean);
      await Promise.all(stockRevertPromises);

      // Deduct stock for new/increased items
      const stockDeductPromises = (values.inventoryItems || []).map(item => {
        const oldQuantity = existingItemsMap.get(item.inventory_item_id) || 0;
        if (item.quantity_used > oldQuantity) {
          const diff = item.quantity_used - oldQuantity;
          return supabase.rpc('decrement_quantity', { item_id: item.inventory_item_id, amount: diff });
        }
        return null;
      }).filter(Boolean);
      await Promise.all(stockDeductPromises);

      // Delete all existing service order items and re-insert
      await supabase.from('service_order_inventory_items').delete().eq('service_order_id', id);
      if (values.inventoryItems && values.inventoryItems.length > 0) {
        const itemsToInsert = values.inventoryItems.map(item => ({
          service_order_id: id, inventory_item_id: item.inventory_item_id, user_id: user.id,
          quantity_used: item.quantity_used, cost_at_time: item.cost_at_time, price_at_time: item.price_at_time,
        }));
        await supabase.from('service_order_inventory_items').insert(itemsToInsert);
      }

      // Update custom field values
      await supabase.from('service_order_field_values').delete().eq('service_order_id', id); // Delete existing values
      if (values.customFields) {
        const customFieldValuesToInsert = Object.entries(values.customFields)
          .map(([fieldId, value]) => {
            if (Array.isArray(value)) {
              return value.map(singleValue => ({
                service_order_id: id,
                custom_field_id: fieldId,
                value: singleValue,
              }));
            }
            return {
              service_order_id: id,
              custom_field_id: fieldId,
              value: typeof value === 'string' ? value : String(value),
            };
          })
          .flat()
          .filter(item => item.value !== '' && item.value !== null);

        if (customFieldValuesToInsert.length > 0) {
          await supabase.from('service_order_field_values').insert(customFieldValuesToInsert);
        }
      }

      await supabase.from('service_orders').update({
        issue_description: values.issueDescription, service_details: values.serviceDetails,
        parts_cost: values.partsCost, service_cost: values.serviceCost, total_amount: values.totalAmount,
        guarantee_terms: values.guaranteeTerms, warranty_days: values.warranty_days,
        status: values.status, updated_at: new Date().toISOString(),
        client_checklist: values.clientChecklist || {},
        is_untestable: values.isUntestable,
        casing_status: values.casing_status, // Save new field
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
      fetchServiceOrderDetails(id); // Refresh data
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
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Wrench className="h-6 w-6 text-primary" /> Detalhes do Serviço</h2>
          <FormField control={form.control} name="issueDescription" render={({ field }) => (<FormItem><FormLabel>Defeito Relatado</FormLabel><FormControl><Textarea placeholder="Descreva o problema..." className="min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="serviceDetails" render={({ field }) => (<FormItem><FormLabel>Detalhes do Serviço</FormLabel><FormControl><Textarea placeholder="Descreva o serviço a ser realizado..." className="min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>)} />

          {/* Client Checklist Section */}
          <div className="p-4 border rounded-lg space-y-4">
            <h2 className="font-semibold text-lg flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary" /> Checklist do Cliente</h2>
            <FormDescription>
              Marque o status de cada item do aparelho ou indique se não foi possível testar.
            </FormDescription>
            <FormField
              control={form.control}
              name="clientChecklist"
              render={({ field }) => (
                <FormField
                  control={form.control}
                  name="isUntestable"
                  render={({ field: isUntestableField }) => (
                    <FormField
                      control={form.control}
                      name="casing_status"
                      render={({ field: casingField }) => (
                        <ClientChecklistInput
                          options={clientChecklistOptions}
                          value={field.value || {}}
                          onChange={field.onChange}
                          isUntestable={isUntestableField.value}
                          onIsUntestableChange={isUntestableField.onChange}
                          casingStatus={casingField.value || null}
                          onCasingStatusChange={casingField.onChange}
                        />
                      )}
                    />
                  )}
                />
              )}
            />
          </div>

          {/* Dynamic Custom Fields Section */}
          {customFieldDefinitions.length > 0 && (
            <div className="p-4 border rounded-lg space-y-4">
              <h2 className="font-semibold text-lg flex items-center gap-2"><List className="h-5 w-5 text-primary" /> Campos Personalizados</h2>
              {customFieldDefinitions.map(fieldDef => (
                <FormField
                  key={fieldDef.id}
                  control={form.control}
                  name={`customFields.${fieldDef.id}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        {fieldDef.field_name} {fieldDef.is_required && <span className="text-red-500">*</span>}
                      </FormLabel>
                      <FormControl>
                        {fieldDef.field_type === 'text' && <Input {...field} />}
                        {fieldDef.field_type === 'textarea' && <Textarea className="min-h-[80px]" {...field} />}
                        {fieldDef.field_type === 'select' && (
                          <Select onValueChange={field.onChange} defaultValue={field.value as string}>
                            <SelectTrigger><SelectValue placeholder={`Selecione ${fieldDef.field_name}`} /></SelectTrigger>
                            <SelectContent>
                              {fieldDef.options?.map(option => (
                                <SelectItem key={option} value={option}>{option}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {fieldDef.field_type === 'checkbox' && (
                          <div className="flex flex-col space-y-2">
                            {fieldDef.options?.map(option => (
                              <FormField
                                key={option}
                                control={form.control}
                                name={`customFields.${fieldDef.id}`}
                                render={({ field: checkboxField }) => {
                                  const checked = Array.isArray(checkboxField.value) && checkboxField.value.includes(option);
                                  return (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={checked}
                                          onCheckedChange={(isChecked) => {
                                            if (isChecked) {
                                              checkboxField.onChange([...(Array.isArray(checkboxField.value) ? checkboxField.value : []), option]);
                                            } else {
                                              checkboxField.onChange((checkboxField.value as string[]).filter(
                                                (value) => value !== option
                                              ));
                                            }
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">{option}</FormLabel>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
          )}

          <h2 className="text-2xl font-bold mt-8 mb-4 flex items-center gap-2"><Package className="h-6 w-6 text-primary" /> Peças e Materiais Utilizados</h2>
          <div className="space-y-4">
            {fields.map((item, index) => (
              <div key={item.id} className="flex flex-col sm:flex-row items-center gap-2 p-2 border rounded-md">
                <FormField
                  control={form.control}
                  name={`inventoryItems.${index}.inventory_item_id`}
                  render={({ field }) => (
                    <FormItem className="flex-grow w-full sm:w-auto">
                        <FormLabel className="sr-only">Item</FormLabel>
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
                                        form.setValue(`inventoryItems.${index}.name`, option.name);
                                        form.setValue(`inventoryItems.${index}.cost_at_time`, option.cost_price);
                                        form.setValue(`inventoryItems.${index}.price_at_time`, option.selling_price);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          option.id === field.value ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                    {option.name} (Qtd: {option.quantity})
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`inventoryItems.${index}.quantity_used`}
                  render={({ field }) => (
                    <FormItem className="w-24">
                      <FormLabel className="sr-only">Quantidade</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="font-semibold w-24 text-right">
                  R$ {(watchedItems?.[index]?.price_at_time * watchedItems?.[index]?.quantity_used || 0).toFixed(2)}
                </div>
                <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => handleAddInventoryItem(inventoryOptions[0]?.id || '')} className="w-full" disabled={inventoryOptions.length === 0}>
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Item
            </Button>
          </div>

          <h2 className="text-2xl font-bold mt-8 mb-4 flex items-center gap-2"><DollarSign className="h-6 w-6 text-primary" /> Detalhes e Custos do Serviço</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="serviceCost" render={({ field }) => (<FormItem><FormLabel>Custo da Mão de Obra (R$)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="partsCost" render={({ field }) => (<FormItem><FormLabel>Custo das Peças (R$)</FormLabel><FormControl><Input type="number" readOnly disabled {...field} /></FormControl><FormMessage /></FormItem>)} />
          </div>
          <div className="text-right font-bold text-xl">Total: R$ {form.watch("totalAmount")?.toFixed(2)}</div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="warranty_days" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Garantia (dias)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status da OS</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{serviceOrderStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
          </div>
          <FormField control={form.control} name="guaranteeTerms" render={({ field }) => (<FormItem><FormLabel>Termos de Garantia</FormLabel><FormControl><Textarea className="min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>)} />

          <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t gap-4">
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : <><Save className="mr-2 h-4 w-4" /> Salvar Alterações</>}</Button>
            
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
                      <DollarSign className="h-4 w-4 mr-2" /> Finalizar e Registrar Pagamento
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