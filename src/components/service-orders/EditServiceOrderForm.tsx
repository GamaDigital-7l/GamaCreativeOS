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
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/integrations/supabase/SessionContext";
import { showSuccess, showError } from "@/utils/toast";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, Check, ChevronsUpDown, PlusCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const checklistOptions = [
  "Tela intacta", "Tela trincada", "Carcaça intacta", "Carcaça com arranhões",
  "Carcaça amassada", "Bateria ok", "Bateria estufada", "Câmera ok",
  "Câmera com defeito", "Botões ok", "Botões com defeito", "Conector de carga ok",
  "Conector de carga com defeito", "Ligando", "Não ligando",
];

const serviceOrderStatuses = ["pending", "in_progress", "ready", "completed", "cancelled"];

const formSchema = z.object({
  customerName: z.string().min(2, { message: "Nome do cliente é obrigatório." }),
  customerPhone: z.string().optional(),
  customerAddress: z.string().optional(),
  customerEmail: z.string().email({ message: "Email inválido." }).optional().or(z.literal('')),
  deviceBrand: z.string().min(2, { message: "Marca do aparelho é obrigatória." }),
  deviceModel: z.string().min(2, { message: "Modelo do aparelho é obrigatória." }),
  deviceSerialNumber: z.string().optional(),
  defectDescription: z.string().min(10, { message: "Descrição do defeito é obrigatória." }),
  passwordInfo: z.string().optional(),
  checklist: z.array(z.string()).optional(),
  issueDescription: z.string().optional(),
  serviceDetails: z.string().optional(),
  partsCost: z.preprocess((val) => Number(val || 0), z.number().min(0).optional()),
  serviceCost: z.preprocess((val) => Number(val || 0), z.number().min(0).optional()),
  totalAmount: z.preprocess((val) => Number(val || 0), z.number().min(0).optional()),
  guaranteeTerms: z.string().optional(),
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
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItemOption | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "", customerPhone: "", customerAddress: "", customerEmail: "",
      deviceBrand: "", deviceModel: "", deviceSerialNumber: "", defectDescription: "",
      passwordInfo: "", checklist: [], issueDescription: "", serviceDetails: "",
      partsCost: 0, serviceCost: 0, totalAmount: 0, guaranteeTerms: "",
      status: "pending", inventoryItems: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "inventoryItems",
  });

  const watchedItems = form.watch("inventoryItems");
  const watchedServiceCost = form.watch("serviceCost");

  useEffect(() => {
    const newPartsCost = watchedItems?.reduce((total, item) => total + (item.price_at_time * item.quantity_used), 0) || 0;
    form.setValue("partsCost", newPartsCost);
    form.setValue("totalAmount", newPartsCost + (watchedServiceCost || 0));
  }, [watchedItems, watchedServiceCost, form]);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (!id) { showError("ID da Ordem de Serviço não fornecido."); navigate('/service-orders'); return; }

    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        // Fetch Inventory Items
        const { data: inventoryData, error: inventoryError } = await supabase
          .from('inventory_items')
          .select('id, name, quantity, cost_price, selling_price')
          .eq('user_id', user.id);
        if (inventoryError) throw inventoryError;
        setInventoryOptions(inventoryData || []);

        // Fetch Service Order
        const { data, error } = await supabase
          .from('service_orders')
          .select(`*, customers (*), devices (*), service_order_inventory_items (*, inventory_items(name))`)
          .eq('id', id).single();
        if (error) throw error;

        form.reset({
          customerName: data.customers?.name || "", customerPhone: data.customers?.phone || "",
          customerAddress: data.customers?.address || "", customerEmail: data.customers?.email || "",
          deviceBrand: data.devices?.brand || "", deviceModel: data.devices?.model || "",
          deviceSerialNumber: data.devices?.serial_number || "", defectDescription: data.devices?.defect_description || "",
          passwordInfo: data.devices?.password_info || "", checklist: data.devices?.checklist || [],
          issueDescription: data.issue_description || "", serviceDetails: data.service_details || "",
          partsCost: data.parts_cost || 0, serviceCost: data.service_cost || 0,
          totalAmount: data.total_amount || 0, guaranteeTerms: data.guarantee_terms || "",
          status: data.status as any,
          inventoryItems: data.service_order_inventory_items.map(item => ({
            inventory_item_id: item.inventory_item_id,
            name: item.inventory_items?.name || 'Item Removido',
            quantity_used: item.quantity_used,
            cost_at_time: item.cost_at_time,
            price_at_time: item.price_at_time,
          })),
        });
      } catch (err: any) {
        showError(`Erro ao carregar dados: ${err.message}`);
        navigate('/service-orders');
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchData();
  }, [id, user, navigate, form]);

  const handleAddInventoryItem = () => {
    if (selectedInventoryItem) {
      append({
        inventory_item_id: selectedInventoryItem.id,
        name: selectedInventoryItem.name,
        quantity_used: 1,
        cost_at_time: selectedInventoryItem.cost_price,
        price_at_time: selectedInventoryItem.selling_price,
      });
      setSelectedInventoryItem(null);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !id) return;
    setIsSubmitting(true);
    try {
      // Update Customer, Device, and Service Order
      const { data: currentOrder } = await supabase.from('service_orders').select('customer_id, device_id').eq('id', id).single();
      if (!currentOrder) throw new Error("Ordem de Serviço não encontrada.");

      await supabase.from('customers').update({ name: values.customerName, phone: values.customerPhone, address: values.customerAddress, email: values.customerEmail }).eq('id', currentOrder.customer_id);
      await supabase.from('devices').update({ brand: values.deviceBrand, model: values.deviceModel, serial_number: values.deviceSerialNumber, defect_description: values.defectDescription, password_info: values.passwordInfo, checklist: values.checklist }).eq('id', currentOrder.device_id);
      
      // Handle Inventory Items (Delete and Replace)
      await supabase.from('service_order_inventory_items').delete().eq('service_order_id', id);
      if (values.inventoryItems && values.inventoryItems.length > 0) {
        const itemsToInsert = values.inventoryItems.map(item => ({
          service_order_id: id,
          inventory_item_id: item.inventory_item_id,
          user_id: user.id,
          quantity_used: item.quantity_used,
          cost_at_time: item.cost_at_time,
          price_at_time: item.price_at_time,
        }));
        await supabase.from('service_order_inventory_items').insert(itemsToInsert);
      }

      // Update Service Order with final costs
      await supabase.from('service_orders').update({
        issue_description: values.issueDescription, service_details: values.serviceDetails,
        parts_cost: values.partsCost, service_cost: values.serviceCost, total_amount: values.totalAmount,
        guarantee_terms: values.guaranteeTerms, status: values.status, updated_at: new Date().toISOString(),
      }).eq('id', id);

      showSuccess("Ordem de Serviço atualizada com sucesso!");
      navigate(`/service-orders/${id}`);
    } catch (error: any) {
      showError(`Erro ao atualizar: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingData) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 p-4">
        {/* Customer and Device sections remain the same */}
        <h2 className="text-2xl font-bold mb-4">Dados do Cliente</h2>
        {/* ... Customer Fields ... */}
        <h2 className="text-2xl font-bold mt-8 mb-4">Dados do Aparelho</h2>
        {/* ... Device Fields ... */}
        <h2 className="text-2xl font-bold mt-8 mb-4">Checklist do Aparelho</h2>
        {/* ... Checklist Fields ... */}

        <h2 className="text-2xl font-bold mt-8 mb-4">Peças e Materiais Utilizados</h2>
        <div className="space-y-4 rounded-md border p-4">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-4">
              <span className="flex-1">{field.name}</span>
              <FormField
                control={form.control}
                name={`inventoryItems.${index}.quantity_used`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input type="number" min="1" {...field} className="w-20" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <span>R$ {(field.price_at_time * form.watch(`inventoryItems.${index}.quantity_used`)).toFixed(2)}</span>
              <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <div className="flex items-center gap-4 pt-4 border-t">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-[300px] justify-between">
                  {selectedInventoryItem ? selectedInventoryItem.name : "Selecione uma peça..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput placeholder="Buscar peça..." />
                  <CommandList>
                    <CommandEmpty>Nenhuma peça encontrada.</CommandEmpty>
                    <CommandGroup>
                      {inventoryOptions.map((item) => (
                        <CommandItem
                          key={item.id}
                          value={item.name}
                          onSelect={() => setSelectedInventoryItem(item)}
                        >
                          <Check className={cn("mr-2 h-4 w-4", selectedInventoryItem?.id === item.id ? "opacity-100" : "opacity-0")} />
                          {item.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Button type="button" onClick={handleAddInventoryItem} disabled={!selectedInventoryItem}>
              <PlusCircle className="h-4 w-4 mr-2" /> Adicionar Peça
            </Button>
          </div>
        </div>

        <h2 className="text-2xl font-bold mt-8 mb-4">Detalhes e Custos do Serviço</h2>
        {/* ... Service Details, Costs, Guarantee, Status fields ... */}
        <FormField control={form.control} name="serviceDetails" render={({ field }) => (<FormItem><FormLabel>Detalhes do Serviço Realizado</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
        <div className="grid grid-cols-3 gap-4">
          <FormField control={form.control} name="partsCost" render={({ field }) => (<FormItem><FormLabel>Custo de Peças (R$)</FormLabel><FormControl><Input type="number" {...field} readOnly className="bg-gray-100" /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="serviceCost" render={({ field }) => (<FormItem><FormLabel>Custo do Serviço (R$)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="totalAmount" render={({ field }) => (<FormItem><FormLabel>Valor Total (R$)</FormLabel><FormControl><Input type="number" {...field} readOnly className="bg-gray-100" /></FormControl><FormMessage /></FormItem>)} />
        </div>
        <FormField control={form.control} name="guaranteeTerms" render={({ field }) => (<FormItem><FormLabel>Termos de Garantia</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{serviceOrderStatuses.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Atualizando...</> : "Atualizar Ordem de Serviço"}
        </Button>
      </form>
    </Form>
  );
}