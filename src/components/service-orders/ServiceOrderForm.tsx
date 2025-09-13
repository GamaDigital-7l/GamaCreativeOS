import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/integrations/supabase/SessionContext";
import { showSuccess, showError } from "@/utils/toast";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { Loader2, Check, ChevronsUpDown, PlusCircle, User, Smartphone, Wrench, Camera, Tag, Hash, Lock, ListChecks } from "lucide-react"; // Adicionado Tag, Hash, Lock, ListChecks icons
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { PhotoUploadDialog } from "./PhotoUploadDialog";
import { NewCustomerForm } from "../customers/NewCustomerForm";
import { VisualChecklist } from "./VisualChecklist";

const formSchema = z.object({
  customerId: z.string({ required_error: "Selecione um cliente." }),
  deviceSelection: z.enum(["existing", "new"], { required_error: "Selecione uma opção." }),
  deviceId: z.string().optional(),
  newDeviceBrand: z.string().optional(),
  newDeviceModel: z.string().optional(),
  newDeviceSerial: z.string().optional(),
  newDevicePassword: z.string().optional(),
  newDeviceChecklist: z.record(z.string()).optional(),
  issueDescription: z.string().min(10, { message: "A descrição do problema é obrigatória." }),
}).superRefine((data, ctx) => {
  if (data.deviceSelection === 'existing' && !data.deviceId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Selecione um aparelho existente.", path: ["deviceId"] });
  }
  if (data.deviceSelection === 'new') {
    if (!data.newDeviceBrand || data.newDeviceBrand.length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Marca é obrigatória.", path: ["newDeviceBrand"] });
    }
    if (!data.newDeviceModel || data.newDeviceModel.length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Modelo é obrigatório.", path: ["newDeviceModel"] });
    }
  }
});

interface Entity { id: string; name: string; }
interface Device extends Entity { brand: string; model: string; }

export function ServiceOrderForm() {
  const { user } = useSession();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Entity[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [newServiceOrderId, setNewServiceOrderId] = useState<string | null>(null);
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { deviceSelection: "existing", newDeviceChecklist: {} },
  });

  const deviceSelection = form.watch("deviceSelection");
  const customerId = form.watch("customerId");

  useEffect(() => {
    if (!user) return;
    supabase.from('customers').select('id, name').eq('user_id', user.id).order('name').then(({ data }) => setCustomers(data || []));
  }, [user]);

  useEffect(() => {
    if (customerId) {
      supabase.from('devices').select('id, brand, model').eq('customer_id', customerId)
        .then(({ data }) => setDevices(data as Device[] || []));
    } else {
      setDevices([]);
    }
    form.setValue("deviceId", undefined);
  }, [customerId, form]);

  const handleNewCustomerSuccess = (newCustomer: { id: string; name: string }) => {
    setCustomers(prev => [...prev, newCustomer].sort((a, b) => a.name.localeCompare(b.name)));
    form.setValue("customerId", newCustomer.id);
    setIsNewCustomerOpen(false);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;
    setIsSubmitting(true);
    let finalDeviceId = values.deviceId;

    try {
      if (values.deviceSelection === 'new') {
        const { data: newDevice, error: deviceError } = await supabase.from('devices').insert({
          customer_id: values.customerId,
          user_id: user.id,
          brand: values.newDeviceBrand,
          model: values.newDeviceModel,
          serial_number: values.newDeviceSerial,
          password_info: values.newDevicePassword,
          checklist: values.newDeviceChecklist ? Object.entries(values.newDeviceChecklist).filter(([, status]) => status !== 'ok').map(([key, status]) => `${key}: ${status}`) : [], // Convert checklist object to array of strings
          defect_description: values.issueDescription, // Using main description here
        }).select('id').single();

        if (deviceError) throw deviceError;
        finalDeviceId = newDevice.id;
      }

      const { data: osData, error: osError } = await supabase.from('service_orders').insert({
        customer_id: values.customerId,
        device_id: finalDeviceId,
        user_id: user.id,
        issue_description: values.issueDescription,
        status: 'pending',
      }).select('id').single();

      if (osError) throw osError;

      showSuccess("Ordem de Serviço criada com sucesso!");
      setNewServiceOrderId(osData.id);
    } catch (error: any) {
      showError(`Erro ao criar OS: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleDialogClose = () => {
    if (newServiceOrderId) navigate(`/service-orders/${newServiceOrderId}/edit`);
    setNewServiceOrderId(null);
  };

  return (
    <>
      {newServiceOrderId && <PhotoUploadDialog isOpen={!!newServiceOrderId} onClose={handleDialogClose} serviceOrderId={newServiceOrderId} />}
      <Dialog open={isNewCustomerOpen} onOpenChange={setIsNewCustomerOpen}><DialogContent><DialogHeader><DialogTitle className="flex items-center gap-2"><UserPlus className="h-6 w-6 text-primary" /> Novo Cliente</DialogTitle></DialogHeader><NewCustomerForm onSuccess={handleNewCustomerSuccess} /></DialogContent></Dialog>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
          <div className="p-4 border rounded-lg">
            <FormField control={form.control} name="customerId" render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="font-semibold text-lg flex items-center gap-2"><User className="h-5 w-5 text-primary" /> 1. Cliente</FormLabel>
                <EntitySelector entities={customers} placeholder="Buscar cliente..." notFoundText="Nenhum cliente encontrado." onSelect={(id) => field.onChange(id)} value={field.value} />
                <FormMessage />
                <Button type="button" variant="link" size="sm" className="p-0 h-auto mt-2 self-start" onClick={() => setIsNewCustomerOpen(true)}><PlusCircle className="mr-2 h-4 w-4"/>Cadastrar novo cliente</Button>
              </FormItem>
            )} />
          </div>

          {customerId && (
            <div className="p-4 border rounded-lg space-y-4">
              <FormField control={form.control} name="deviceSelection" render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-lg flex items-center gap-2"><Smartphone className="h-5 w-5 text-primary" /> 2. Aparelho</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col sm:flex-row gap-4 pt-2">
                      <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="existing" /></FormControl><FormLabel className="font-normal ml-2">Selecionar existente</FormLabel></FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="new" /></FormControl><FormLabel className="font-normal ml-2">Cadastrar novo</FormLabel></FormItem>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )} />

              {deviceSelection === 'existing' && (
                <FormField control={form.control} name="deviceId" render={({ field }) => (
                  <FormItem className="flex flex-col"><EntitySelector entities={devices.map(d => ({ id: d.id, name: `${d.brand} ${d.model}` }))} placeholder="Buscar aparelho..." notFoundText="Nenhum aparelho cadastrado." onSelect={(id) => field.onChange(id)} value={field.value || ''} /><FormMessage /></FormItem>
                )} />
              )}

              {deviceSelection === 'new' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                  <div className="space-y-4">
                    <FormField control={form.control} name="newDeviceBrand" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Tag className="h-4 w-4" /> Marca</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="newDeviceModel" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Smartphone className="h-4 w-4" /> Modelo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="newDeviceSerial" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Hash className="h-4 w-4" /> Série/IMEI (Opcional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="newDevicePassword" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Lock className="h-4 w-4" /> Senha/Padrão (Opcional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <div>
                    <FormLabel className="flex items-center gap-2"><Camera className="h-4 w-4" /> Checklist Visual</FormLabel>
                    <Controller control={form.control} name="newDeviceChecklist" render={({ field }) => (<VisualChecklist value={field.value || {}} onChange={field.onChange} />)} />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="p-4 border rounded-lg">
            <FormField control={form.control} name="issueDescription" render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-lg flex items-center gap-2"><Wrench className="h-5 w-5 text-primary" /> 3. Defeito / Problema Relatado</FormLabel>
                <FormControl><Textarea placeholder="Descreva em detalhes o problema relatado pelo cliente..." className="min-h-[100px]" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando OS...</> : <><PlusCircle className="mr-2 h-4 w-4" /> Criar Ordem de Serviço</>}</Button>
        </form>
      </Form>
    </>
  );
}

function EntitySelector({ entities, placeholder, notFoundText, onSelect, value }: { entities: Entity[], placeholder: string, notFoundText: string, onSelect: (id: string) => void, value?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FormControl>
          <Button variant="outline" role="combobox" className={cn("w-full justify-between", !value && "text-muted-foreground")}>
            {value ? entities.find(e => e.id === value)?.name : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0"><Command><CommandInput placeholder={placeholder} /><CommandList><CommandEmpty>{notFoundText}</CommandEmpty><CommandGroup>{entities.map((entity) => (<CommandItem value={entity.name} key={entity.id} onSelect={() => { onSelect(entity.id); setOpen(false); }}><Check className={cn("mr-2 h-4 w-4", entity.id === value ? "opacity-100" : "opacity-0")} />{entity.name}</CommandItem>))}</CommandGroup></CommandList></Command></PopoverContent>
    </Popover>
  );
}