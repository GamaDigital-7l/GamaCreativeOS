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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/integrations/supabase/SessionContext";
import { showSuccess, showError } from "@/utils/toast";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

const checklistOptions = [
  "Tela intacta",
  "Tela trincada",
  "Carcaça intacta",
  "Carcaça com arranhões",
  "Carcaça amassada",
  "Bateria ok",
  "Bateria estufada",
  "Câmera ok",
  "Câmera com defeito",
  "Botões ok",
  "Botões com defeito",
  "Conector de carga ok",
  "Conector de carga com defeito",
  "Ligando",
  "Não ligando",
];

const serviceOrderStatuses = [
  "pending",
  "in_progress",
  "ready",
  "completed",
  "cancelled",
];

const formSchema = z.object({
  customerName: z.string().min(2, { message: "Nome do cliente é obrigatório." }),
  customerPhone: z.string().optional(),
  customerAddress: z.string().optional(),
  customerEmail: z.string().email({ message: "Email inválido." }).optional().or(z.literal('')),
  deviceBrand: z.string().min(2, { message: "Marca do aparelho é obrigatória." }),
  deviceModel: z.string().min(2, { message: "Modelo do aparelho é obrigatória." }),
  deviceSerialNumber: z.string().optional(),
  defectDescription: z.string().min(10, { message: "Descrição do defeito é obrigatória e deve ter pelo menos 10 caracteres." }),
  passwordInfo: z.string().optional(),
  checklist: z.array(z.string()).optional(),
  issueDescription: z.string().optional(),
  serviceDetails: z.string().optional(),
  partsCost: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(0, { message: "Custo de peças não pode ser negativo." }).optional()
  ),
  serviceCost: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(0, { message: "Custo do serviço não pode ser negativo." }).optional()
  ),
  totalAmount: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(0, { message: "Valor total não pode ser negativo." }).optional()
  ),
  guaranteeTerms: z.string().optional(),
  status: z.enum(["pending", "in_progress", "ready", "completed", "cancelled"], {
    required_error: "O status da ordem de serviço é obrigatório.",
  }),
});

export function EditServiceOrderForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSession();
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      customerAddress: "",
      customerEmail: "",
      deviceBrand: "",
      deviceModel: "",
      deviceSerialNumber: "",
      defectDescription: "",
      passwordInfo: "",
      checklist: [],
      issueDescription: "",
      serviceDetails: "",
      partsCost: 0,
      serviceCost: 0,
      totalAmount: 0,
      guaranteeTerms: "",
      status: "pending",
    },
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!id) {
      showError("ID da Ordem de Serviço não fornecido.");
      navigate('/service-orders');
      return;
    }

    const fetchServiceOrder = async () => {
      setIsLoadingData(true);
      try {
        const { data, error } = await supabase
          .from('service_orders')
          .select(`
            *,
            customers (id, name, phone, address, email),
            devices (id, brand, model, serial_number, defect_description, password_info, checklist)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!data) {
          showError("Ordem de Serviço não encontrada.");
          navigate('/service-orders');
          return;
        }

        form.reset({
          customerName: data.customers?.name || "",
          customerPhone: data.customers?.phone || "",
          customerAddress: data.customers?.address || "",
          customerEmail: data.customers?.email || "",
          deviceBrand: data.devices?.brand || "",
          deviceModel: data.devices?.model || "",
          deviceSerialNumber: data.devices?.serial_number || "",
          defectDescription: data.devices?.defect_description || "",
          passwordInfo: data.devices?.password_info || "",
          checklist: data.devices?.checklist || [],
          issueDescription: data.issue_description || "",
          serviceDetails: data.service_details || "",
          partsCost: data.parts_cost || 0,
          serviceCost: data.service_cost || 0,
          totalAmount: data.total_amount || 0,
          guaranteeTerms: data.guarantee_terms || "",
          status: data.status as z.infer<typeof formSchema>["status"],
        });
      } catch (error: any) {
        console.error("Erro ao carregar Ordem de Serviço para edição:", error);
        showError(`Erro ao carregar dados: ${error.message || "Tente novamente."}`);
        navigate('/service-orders');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchServiceOrder();
  }, [id, user, navigate, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      showError("Você precisa estar logado para editar uma Ordem de Serviço.");
      navigate('/login');
      return;
    }
    if (!id) {
      showError("ID da Ordem de Serviço não fornecido.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Fetch current service order to get customer_id and device_id
      const { data: currentOrder, error: fetchError } = await supabase
        .from('service_orders')
        .select('customer_id, device_id')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      if (!currentOrder) throw new Error("Ordem de Serviço não encontrada para atualização.");

      // 1. Update Customer
      const { error: customerError } = await supabase
        .from('customers')
        .update({
          name: values.customerName,
          phone: values.customerPhone,
          address: values.customerAddress,
          email: values.customerEmail,
        })
        .eq('id', currentOrder.customer_id);

      if (customerError) throw customerError;

      // 2. Update Device
      const { error: deviceError } = await supabase
        .from('devices')
        .update({
          brand: values.deviceBrand,
          model: values.deviceModel,
          serial_number: values.deviceSerialNumber,
          defect_description: values.defectDescription,
          password_info: values.passwordInfo,
          checklist: values.checklist,
        })
        .eq('id', currentOrder.device_id);

      if (deviceError) throw deviceError;

      // 3. Update Service Order
      const { error: serviceOrderError } = await supabase
        .from('service_orders')
        .update({
          issue_description: values.issueDescription || values.defectDescription,
          service_details: values.serviceDetails,
          parts_cost: values.partsCost,
          service_cost: values.serviceCost,
          total_amount: values.totalAmount,
          guarantee_terms: values.guaranteeTerms,
          status: values.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (serviceOrderError) throw serviceOrderError;

      showSuccess("Ordem de Serviço atualizada com sucesso!");
      navigate(`/service-orders/${id}`); // Redirect back to the detail page
    } catch (error: any) {
      console.error("Erro ao atualizar Ordem de Serviço:", error);
      showError(`Erro ao atualizar Ordem de Serviço: ${error.message || "Tente novamente."}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-gray-600 dark:text-gray-400">Carregando dados da Ordem de Serviço...</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
        <h2 className="text-2xl font-bold mb-4">Dados do Cliente</h2>
        <FormField
          control={form.control}
          name="customerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Nome do cliente" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="customerPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <Input placeholder="(XX) XXXXX-XXXX" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="customerAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço</FormLabel>
              <FormControl>
                <Input placeholder="Rua, Número, Bairro, Cidade" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="customerEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="email@exemplo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <h2 className="text-2xl font-bold mt-8 mb-4">Dados do Aparelho</h2>
        <FormField
          control={form.control}
          name="deviceBrand"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marca</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Samsung, Apple" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="deviceModel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Modelo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Galaxy S21, iPhone 13" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="deviceSerialNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de Série/IMEI</FormLabel>
              <FormControl>
                <Input placeholder="Opcional" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="defectDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Defeito Relatado</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva o problema que o cliente relatou..."
                  className="resize-y min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="passwordInfo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Informações de Senha/Padrão (Opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Desenhe o padrão ou escreva a senha, se fornecida pelo cliente."
                  className="resize-y min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <h2 className="text-2xl font-bold mt-8 mb-4">Checklist do Aparelho</h2>
        <FormField
          control={form.control}
          name="checklist"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Estado do Aparelho (Marque o que se aplica)</FormLabel>
              </div>
              {checklistOptions.map((item) => (
                <FormField
                  key={item}
                  control={form.control}
                  name="checklist"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={item}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...(field.value || []), item])
                                : field.onChange(
                                    field.value?.filter(
                                      (value) => value !== item
                                    )
                                  );
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {item}
                        </FormLabel>
                      </FormItem>
                    );
                  }}
                />
              ))}
              <FormMessage />
            </FormItem>
          )}
        />

        <h2 className="text-2xl font-bold mt-8 mb-4">Detalhes da Ordem de Serviço</h2>
        <FormField
          control={form.control}
          name="issueDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição do Problema (para OS)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Detalhes adicionais do problema para a ordem de serviço. Se vazio, usará a descrição do defeito."
                  className="resize-y min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="serviceDetails"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Detalhes do Serviço Realizado</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva o serviço que foi ou será realizado..."
                  className="resize-y min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="partsCost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Custo de Peças (R$)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0.00" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="serviceCost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Custo do Serviço (R$)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0.00" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="totalAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor Total (R$)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0.00" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="guaranteeTerms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Termos de Garantia</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva os termos de garantia para este serviço..."
                  className="resize-y min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status da Ordem de Serviço</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {serviceOrderStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status === 'pending' && 'Pendente'}
                      {status === 'in_progress' && 'Em Progresso'}
                      {status === 'ready' && 'Pronto'}
                      {status === 'completed' && 'Concluído'}
                      {status === 'cancelled' && 'Cancelado'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Atualizando...
            </>
          ) : (
            "Atualizar Ordem de Serviço"
          )}
        </Button>
      </form>
    </Form>
  );
}