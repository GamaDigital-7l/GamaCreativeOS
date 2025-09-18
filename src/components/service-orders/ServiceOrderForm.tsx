import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/integrations/supabase/SessionContext";
import { showSuccess, showError } from "@/utils/toast";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { Loader2, Check, ChevronsUpDown, PlusCircle, User, Smartphone, Wrench, ListChecks, Tag, Hash, Lock, UserPlus, Package, Trash2, DollarSign, List, Type, Factory } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { PhotoUploadDialog } from "./PhotoUploadDialog";
import { NewCustomerForm } from "../customers/NewCustomerForm";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientChecklistInput } from "./ClientChecklistInput";

const clientChecklistOptions = [
  "Tela", "Bateria", "Conector", "Touch", "Câmera Frontal",
  "Câmera Traseira", "Face ID / Biometria", "Conector de Carga",
  "Botões Volume", "Botão Power", "Rede", "Wi-Fi", "Bluetooth",
];

// Definindo os novos status para a UI e para o banco de dados
const serviceOrderStatuses = [
  { value: 'orcamento', label: 'Orçamento' },
  { value: 'aguardando_pecas', label: 'Aguardando Peças' },
  { value: 'em_manutencao', label: 'Em Manutenção' },
  { value: 'pronto_para_retirada', label: 'Pronto para Retirada' },
  { value: 'finalizado', label: 'Finalizado' },
  { value: 'nao_teve_reparo', label: 'Não Teve Reparo' },
  { value: 'cancelado_pelo_cliente', label: 'Cancelado pelo Cliente' },
];

const formSchema = z.object({
  customerId: z.string({ required_error: "Selecione um cliente." }),
  deviceBrand: z.string().min(2, { message: "Marca do aparelho é obrigatória." }),
  deviceModel: z.string().min(2, { message: "Modelo do aparelho é obrigatória." }),
  deviceSerial: z.string().optional(),
  devicePassword: z.string().optional(),
  
  clientChecklist: z.record(z.enum(['ok', 'not_working'])).optional(),
  isUntestable: z.boolean().default(false),
  casing_status: z.enum(['good', 'scratched', 'damaged']).optional().nullable(),
  issueDescription: z.string().min(10, { message: "A descrição do problema é obrigatória." }),
  serviceDetails: z.string().optional(),
  
  // Campos financeiros internos
  totalAmount: z.preprocess((val) => Number(String(val || 0).replace(",", ".")), z.number().min(0, "Valor final não pode ser negativo.")),
  partsCost: z.preprocess((val) => Number(String(val || 0).replace(",", ".")), z.number().min(0, "Custo das peças não pode ser negativo.")).optional(),
  partSupplierId: z.string().uuid().optional().nullable(),
  freightCost: z.preprocess((val) => Number(String(val || 0).replace(",", ".")), z.number().min(0, "Custo do frete não pode ser negativo.")).optional(),
  serviceCost: z.preprocess((val) => Number(String(val || 0).replace(",", ".")), z.number().min(0, "Custo da mão de obra não pode ser negativo.")).optional(),

  guaranteeTerms: z.string().optional(),
  warranty_days: z.preprocess((val) => Number(val || 0), z.number().int().min(0).optional()),
  customFields: z.record(z.union([z.string(), z.array(z.string())])).optional(),
  status: z.enum(serviceOrderStatuses.map(s => s.value) as [string, ...string[]]), // Adicionado status ao schema
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

interface Entity { id: string; name: string; }
interface SupplierOption { id: string; name: string; }

interface CustomFieldDefinition {
  id: string;
  field_name: string;
  field_type: 'text' | 'textarea' | 'select' | 'checkbox';
  is_required: boolean;
  options?: string[];
  order_index: number;
}

export function ServiceOrderForm() {
  const { user } = useSession();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Entity[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]); // New state for suppliers
  const [customFieldDefinitions, setCustomFieldDefinitions] = useState<CustomFieldDefinition[]>([]);
  const [newServiceOrderId, setNewServiceOrderId] = useState<string | null>(null);
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      deviceBrand: "",
      deviceModel: "",
      deviceSerial: "",
      devicePassword: "",
      clientChecklist: {},
      isUntestable: false,
      casing_status: null,
      serviceDetails: "",
      issueDescription: "",
      
      totalAmount: 0,
      partsCost: 0,
      partSupplierId: null,
      freightCost: 0,
      serviceCost: 0,

      guaranteeTerms: "",
      warranty_days: 90,
      customFields: {},
      status: 'orcamento', // Default status for new OS
    },
    context: { customFieldDefinitions },
  });

  const customerId = form.watch("customerId");

  useEffect(() => {
    if (!user) return;
    const fetchInitialData = async () => {
      // Fetch customers
      const { data: customersData } = await supabase.from('customers').select('id, name').eq('user_id', user.id).order('name');
      setCustomers(customersData || []);

      // Fetch suppliers
      const { data: suppliersData } = await supabase.from('suppliers').select('id, name').eq('user_id', user.id).order('name');
      setSuppliers(suppliersData || []);

      // Fetch default guarantee terms from user settings
      const { data: settingsData } = await supabase.from("user_settings").select("default_guarantee_terms").eq("id", user.id).single();
      form.setValue("guaranteeTerms", settingsData?.default_guarantee_terms || "Não há termos de garantia padrão definidos.");

      // Fetch custom field definitions
      const { data: customFieldsData, error: customFieldsError } = await supabase
        .from('service_order_custom_fields')
        .select('*')
        .eq('user_id', user.id)
        .order('order_index', { ascending: true });
      if (customFieldsError) {
        showError(`Erro ao carregar definições de campos personalizados: ${customFieldsError.message}`);
      } else {
        setCustomFieldDefinitions(customFieldsData || []);
        // Initialize custom field values in the form
        const initialCustomFieldValues: Record<string, string | string[]> = {};
        customFieldsData?.forEach(field => {
          if (field.field_type === 'checkbox') {
            initialCustomFieldValues[field.id] = [];
          } else {
            initialCustomFieldValues[field.id] = '';
          }
        });
        form.setValue('customFields', initialCustomFieldValues);
      }
    };
    fetchInitialData();
  }, [user, form]);

  const handleNewCustomerSuccess = (newCustomer: { id: string; name: string }) => {
    setCustomers(prev => [...prev, newCustomer].sort((a, b) => a.name.localeCompare(b.name)));
    form.setValue("customerId", newCustomer.id);
    setIsNewCustomerOpen(false);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;
    setIsSubmitting(true);
    let finalDeviceId: string | undefined;

    try {
      // Always create a new device record
      const { data: newDevice, error: deviceError } = await supabase.from('devices').insert({
        customer_id: values.customerId,
        user_id: user.id,
        brand: values.deviceBrand,
        model: values.deviceModel,
        serial_number: values.deviceSerial,
        password_info: values.devicePassword,
        defect_description: values.issueDescription,
      }).select('id').single();

      if (deviceError) throw deviceError;
      finalDeviceId = newDevice.id;
      
      const { data: osData, error: osError } = await supabase.from('service_orders').insert({
        customer_id: values.customerId,
        device_id: finalDeviceId,
        user_id: user.id,
        issue_description: values.issueDescription,
        service_details: values.serviceDetails,
        
        // Campos financeiros internos
        parts_cost: values.partsCost,
        service_cost: values.serviceCost,
        total_amount: values.totalAmount, // Valor final para o cliente
        freight_cost: values.freightCost,
        part_supplier_id: values.partSupplierId,

        guarantee_terms: values.guaranteeTerms,
        warranty_days: values.warranty_days,
        status: values.status, // Usar o status selecionado no formulário
        approval_status: values.status === 'orcamento' ? 'pending_approval' : null, // Definir approval_status se for 'orcamento'
        client_checklist: values.clientChecklist || {},
        is_untestable: values.isUntestable,
        casing_status: values.casing_status,
      }).select('id').single();

      if (osError) throw osError;

      // Insert custom field values
      if (values.customFields) {
        const customFieldValuesToInsert = Object.entries(values.customFields)
          .map(([fieldId, value]) => {
            if (Array.isArray(value)) {
              return value.map(singleValue => ({
                service_order_id: osData.id,
                custom_field_id: fieldId,
                value: singleValue,
              }));
            }
            return {
              service_order_id: osData.id,
              custom_field_id: fieldId,
              value: typeof value === 'string' ? value : String(value),
            };
          })
          .flat()
          .filter(item => item.value !== '' && item.value !== null);

        if (customFieldValuesToInsert.length > 0) {
          const { error: customValuesError } = await supabase.from('service_order_field_values').insert(customFieldValuesToInsert);
          if (customValuesError) throw customValuesError;
        }
      }

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

          <div className="p-4 border rounded-lg space-y-4">
            <h2 className="font-semibold text-lg flex items-center gap-2"><Smartphone className="h-5 w-5 text-primary" /> 2. Aparelho</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
              <div className="space-y-4">
                <FormField control={form.control} name="deviceBrand" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Tag className="h-4 w-4" /> Marca</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="deviceModel" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Smartphone className="h-4 w-4" /> Modelo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="deviceSerial" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Hash className="h-4 w-4" /> Série/IMEI (Opcional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="devicePassword" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Lock className="h-4 w-4" /> Senha/Padrão (Opcional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <FormField control={form.control} name="issueDescription" render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-lg flex items-center gap-2"><Wrench className="h-5 w-5 text-primary" /> 3. Defeito / Problema Relatado</FormLabel>
                <FormControl><Textarea placeholder="Descreva em detalhes o problema relatado pelo cliente..." className="min-h-[100px]" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <div className="p-4 border rounded-lg space-y-4">
            <h2 className="font-semibold text-lg flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary" /> 4. Checklist do Cliente</h2>
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

          {customFieldDefinitions.length > 0 && (
            <div className="p-4 border rounded-lg space-y-4">
              <h2 className="font-semibold text-lg flex items-center gap-2"><List className="h-5 w-5 text-primary" /> 5. Campos Personalizados</h2>
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

          <div className="p-4 border rounded-lg space-y-4">
            <h2 className="font-semibold text-lg flex items-center gap-2"><Wrench className="h-5 w-5 text-primary" /> {customFieldDefinitions.length > 0 ? "6." : "5."} Detalhes do Serviço</h2>
            <FormField control={form.control} name="serviceDetails" render={({ field }) => (<FormItem><FormLabel>Detalhes do Serviço Proposto</FormLabel><FormControl><Textarea placeholder="Descreva o serviço a ser realizado..." className="min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
            
            <FormField control={form.control} name="warranty_days" render={({ field }) => (<FormItem><FormLabel>Garantia (dias)</FormLabel><FormControl><Input type="number" min="0" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="guaranteeTerms" render={({ field }) => (<FormItem><FormLabel>Termos de Garantia</FormLabel><FormControl><Textarea placeholder="Termos de garantia específicos..." className="min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
          </div>

          {/* Nova Seção: Detalhes Financeiros Internos */}
          <div className="p-4 border rounded-lg space-y-4 bg-muted/20">
            <h2 className="font-semibold text-lg flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary" /> Detalhes Financeiros Internos (Apenas para Controle)</h2>
            <FormDescription>
              Estes campos são para seu controle interno e não serão exibidos ao cliente.
            </FormDescription>
            <FormField control={form.control} name="totalAmount" render={({ field }) => (<FormItem><FormLabel>Valor Final para o Cliente (R$)</FormLabel><FormControl><Input type="text" inputMode="decimal" placeholder="0,00" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="partsCost" render={({ field }) => (<FormItem><FormLabel>Custo das Peças (R$)</FormLabel><FormControl><Input type="text" inputMode="decimal" placeholder="0,00" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="partSupplierId" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><Factory className="h-4 w-4" /> Fornecedor da Peça (Opcional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione um fornecedor" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="freightCost" render={({ field }) => (<FormItem><FormLabel>Custo do Frete (R$)</FormLabel><FormControl><Input type="text" inputMode="decimal" placeholder="0,00" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="serviceCost" render={({ field }) => (<FormItem><FormLabel>Custo da Mão de Obra (R$)</FormLabel><FormControl><Input type="text" inputMode="decimal" placeholder="0,00" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
          </div>

          {/* Campo de Status da OS */}
          <div className="p-4 border rounded-lg">
            <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-lg flex items-center gap-2"><Wrench className="h-5 w-5 text-primary" /> 7. Status da Ordem de Serviço</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {serviceOrderStatuses.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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