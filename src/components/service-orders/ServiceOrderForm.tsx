import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/integrations/supabase/SessionContext";
import { showSuccess, showError } from "@/utils/toast";
import { useNavigate, Link } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { Loader2, AlertTriangle, Check, ChevronsUpDown, PlusCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PhotoUploadDialog } from "./PhotoUploadDialog";

const formSchema = z.object({
  customerId: z.string({ required_error: "Selecione um cliente." }),
  deviceId: z.string({ required_error: "Selecione um aparelho." }),
  issueDescription: z.string().min(10, { message: "A descrição do problema é obrigatória." }),
});

interface Entity { id: string; name: string; }
interface Device extends Entity { brand: string; model: string; }
interface WarrantyInfo { id: string; endDate: Date; }

export function ServiceOrderForm() {
  const { user } = useSession();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Entity[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Entity | null>(null);
  const [warrantyInfo, setWarrantyInfo] = useState<WarrantyInfo | null>(null);
  const [newServiceOrderId, setNewServiceOrderId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (!user) return;
    supabase.from('customers').select('id, name').order('name').then(({ data }) => setCustomers(data || []));
  }, [user]);

  const handleCustomerSelect = async (customerId: string) => {
    form.setValue("customerId", customerId);
    form.setValue("deviceId", ""); // Reset device selection
    setWarrantyInfo(null);
    const customer = customers.find(c => c.id === customerId);
    setSelectedCustomer(customer || null);
    const { data } = await supabase.from('devices').select('id, name:model, brand, model').eq('customer_id', customerId);
    setDevices(data as Device[] || []);
  };

  const handleDeviceSelect = async (deviceId: string) => {
    form.setValue("deviceId", deviceId);
    const { data, error } = await supabase
      .from('service_orders')
      .select('id, finalized_at, warranty_days')
      .eq('device_id', deviceId)
      .eq('status', 'completed')
      .not('finalized_at', 'is', null)
      .not('warranty_days', 'is', null)
      .order('finalized_at', { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      const lastOs = data[0];
      const warrantyEndDate = addDays(new Date(lastOs.finalized_at), lastOs.warranty_days);
      if (warrantyEndDate > new Date()) {
        setWarrantyInfo({ id: lastOs.id, endDate: warrantyEndDate });
      } else {
        setWarrantyInfo(null);
      }
    } else {
      setWarrantyInfo(null);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.from('service_orders').insert({
        customer_id: values.customerId,
        device_id: values.deviceId,
        user_id: user.id,
        issue_description: values.issueDescription,
        status: 'pending',
      }).select().single();

      if (error) throw error;
      showSuccess("Ordem de Serviço criada com sucesso!");
      setNewServiceOrderId(data.id); // Open the dialog
    } catch (error: any) {
      showError(`Erro ao criar OS: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleDialogClose = () => {
    if (newServiceOrderId) {
      navigate(`/service-orders/${newServiceOrderId}/edit`);
    }
    setNewServiceOrderId(null);
  };

  return (
    <>
      {newServiceOrderId && (
        <PhotoUploadDialog
          isOpen={!!newServiceOrderId}
          onClose={handleDialogClose}
          serviceOrderId={newServiceOrderId}
        />
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="customerId" render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>1. Selecione o Cliente</FormLabel>
                <EntitySelector
                  entities={customers}
                  placeholder="Buscar cliente..."
                  notFoundText="Nenhum cliente encontrado."
                  onSelect={handleCustomerSelect}
                  value={field.value}
                />
                <FormMessage />
                <Button variant="link" asChild className="p-0 h-auto mt-2 self-start"><Link to="/new-customer"><PlusCircle className="mr-2 h-4 w-4"/>Cadastrar novo cliente</Link></Button>
              </FormItem>
            )} />
            <FormField control={form.control} name="deviceId" render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>2. Selecione o Aparelho</FormLabel>
                <EntitySelector
                  entities={devices.map(d => ({ id: d.id, name: `${d.brand} ${d.model}` }))}
                  placeholder="Buscar aparelho..."
                  notFoundText="Nenhum aparelho encontrado."
                  onSelect={handleDeviceSelect}
                  value={field.value}
                  disabled={!selectedCustomer}
                />
                <FormMessage />
                 <Button variant="link" asChild className="p-0 h-auto mt-2 self-start"><Link to="/new-device"><PlusCircle className="mr-2 h-4 w-4"/>Cadastrar novo aparelho</Link></Button>
              </FormItem>
            )} />
          </div>

          {warrantyInfo && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Aparelho em Garantia!</AlertTitle>
              <AlertDescription>
                Este aparelho está na garantia de um serviço anterior (OS <Link to={`/service-orders/${warrantyInfo.id}`} className="underline font-bold">{warrantyInfo.id.substring(0,8)}</Link>)
                até {format(warrantyInfo.endDate, 'dd/MM/yyyy', { locale: ptBR })}.
              </AlertDescription>
            </Alert>
          )}

          <FormField control={form.control} name="issueDescription" render={({ field }) => (
            <FormItem>
              <FormLabel>3. Defeito / Problema Relatado</FormLabel>
              <FormControl>
                <Textarea placeholder="Descreva o problema relatado pelo cliente..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando OS...</> : "Criar Ordem de Serviço"}
          </Button>
        </form>
      </Form>
    </>
  );
}

// Helper component for searchable dropdown
function EntitySelector({ entities, placeholder, notFoundText, onSelect, value, disabled }: {
  entities: Entity[], placeholder: string, notFoundText: string, onSelect: (id: string) => void, value: string, disabled?: boolean
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FormControl>
          <Button variant="outline" role="combobox" disabled={disabled} className={cn("w-full justify-between", !value && "text-muted-foreground")}>
            {value ? entities.find(e => e.id === value)?.name : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>{notFoundText}</CommandEmpty>
            <CommandGroup>
              {entities.map((entity) => (
                <CommandItem value={entity.name} key={entity.id} onSelect={() => { onSelect(entity.id); setOpen(false); }}>
                  <Check className={cn("mr-2 h-4 w-4", entity.id === value ? "opacity-100" : "opacity-0")} />
                  {entity.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}