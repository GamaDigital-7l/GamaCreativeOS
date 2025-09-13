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
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/integrations/supabase/SessionContext";
import { showSuccess, showError } from "@/utils/toast";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { PhotoUploadDialog } from "./PhotoUploadDialog";

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

const formSchema = z.object({
  customerName: z.string().min(2, { message: "Nome do cliente é obrigatório." }),
  customerPhone: z.string().optional(),
  customerAddress: z.string().optional(),
  customerEmail: z.string().email({ message: "Email inválido." }).optional().or(z.literal('')),
  deviceBrand: z.string().min(2, { message: "Marca do aparelho é obrigatória." }),
  deviceModel: z.string().min(2, { message: "Modelo do aparelho é obrigatório." }),
  deviceSerialNumber: z.string().optional(),
  defectDescription: z.string().min(10, { message: "Descrição do defeito é obrigatória e deve ter pelo menos 10 caracteres." }),
  passwordInfo: z.string().optional(),
  checklist: z.array(z.string()).optional(),
  issueDescription: z.string().optional(),
});

export function ServiceOrderForm() {
  const { user } = useSession();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [newServiceOrderId, setNewServiceOrderId] = useState<string | null>(null);

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
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      showError("Você precisa estar logado para criar uma Ordem de Serviço.");
      navigate('/login');
      return;
    }
    setIsSubmitting(true);
    try {
      // 1. Create Customer
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .insert({
          user_id: user.id,
          name: values.customerName,
          phone: values.customerPhone,
          address: values.customerAddress,
          email: values.customerEmail,
        })
        .select()
        .single();

      if (customerError) throw customerError;

      // 2. Create Device
      const { data: deviceData, error: deviceError } = await supabase
        .from('devices')
        .insert({
          customer_id: customerData.id,
          user_id: user.id,
          brand: values.deviceBrand,
          model: values.deviceModel,
          serial_number: values.deviceSerialNumber,
          defect_description: values.defectDescription,
          password_info: values.passwordInfo,
          checklist: values.checklist,
        })
        .select()
        .single();

      if (deviceError) throw deviceError;

      // 3. Create Service Order
      const { data: serviceOrderData, error: serviceOrderError } = await supabase
        .from('service_orders')
        .insert({
          customer_id: customerData.id,
          device_id: deviceData.id,
          user_id: user.id,
          issue_description: values.issueDescription || values.defectDescription,
          status: 'pending',
        })
        .select()
        .single();

      if (serviceOrderError) throw serviceOrderError;

      showSuccess("Ordem de Serviço criada com sucesso!");
      setNewServiceOrderId(serviceOrderData.id);
      setShowPhotoDialog(true);
      form.reset();
    } catch (error: any) {
      console.error("Erro ao criar Ordem de Serviço:", error);
      showError(`Erro ao criar Ordem de Serviço: ${error.message || "Tente novamente."}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleDialogClose = () => {
    setShowPhotoDialog(false);
    navigate(`/service-orders/${newServiceOrderId}`);
  };

  return (
    <>
      {newServiceOrderId && (
        <PhotoUploadDialog
          isOpen={showPhotoDialog}
          onClose={handleDialogClose}
          serviceOrderId={newServiceOrderId}
        />
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
          {/* ... All form fields remain the same ... */}
          <h2 className="text-2xl font-bold mb-4">Dados do Cliente</h2>
          <FormField control={form.control} name="customerName" render={({ field }) => (<FormItem><FormLabel>Nome Completo</FormLabel><FormControl><Input placeholder="Nome do cliente" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="customerPhone" render={({ field }) => (<FormItem><FormLabel>Telefone</FormLabel><FormControl><Input placeholder="(XX) XXXXX-XXXX" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="customerAddress" render={({ field }) => (<FormItem><FormLabel>Endereço</FormLabel><FormControl><Input placeholder="Rua, Número, Bairro, Cidade" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="customerEmail" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="email@exemplo.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <h2 className="text-2xl font-bold mt-8 mb-4">Dados do Aparelho</h2>
          <FormField control={form.control} name="deviceBrand" render={({ field }) => (<FormItem><FormLabel>Marca</FormLabel><FormControl><Input placeholder="Ex: Samsung, Apple" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="deviceModel" render={({ field }) => (<FormItem><FormLabel>Modelo</FormLabel><FormControl><Input placeholder="Ex: Galaxy S21, iPhone 13" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="deviceSerialNumber" render={({ field }) => (<FormItem><FormLabel>Número de Série/IMEI</FormLabel><FormControl><Input placeholder="Opcional" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="defectDescription" render={({ field }) => (<FormItem><FormLabel>Defeito Relatado</FormLabel><FormControl><Textarea placeholder="Descreva o problema que o cliente relatou..." className="resize-y min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="passwordInfo" render={({ field }) => (<FormItem><FormLabel>Informações de Senha/Padrão (Opcional)</FormLabel><FormControl><Textarea placeholder="Desenhe o padrão ou escreva a senha, se fornecida pelo cliente." className="resize-y min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <h2 className="text-2xl font-bold mt-8 mb-4">Checklist do Aparelho</h2>
          <FormField control={form.control} name="checklist" render={() => (<FormItem><div className="mb-4"><FormLabel className="text-base">Estado do Aparelho (Marque o que se aplica)</FormLabel></div>{checklistOptions.map((item) => (<FormField key={item} control={form.control} name="checklist" render={({ field }) => (<FormItem key={item} className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked) => {return checked ? field.onChange([...(field.value || []), item]) : field.onChange(field.value?.filter((value) => value !== item));}} /></FormControl><FormLabel className="font-normal">{item}</FormLabel></FormItem>)} />))}<FormMessage /></FormItem>)} />
          <h2 className="text-2xl font-bold mt-8 mb-4">Detalhes da Ordem de Serviço</h2>
          <FormField control={form.control} name="issueDescription" render={({ field }) => (<FormItem><FormLabel>Descrição do Problema (para OS)</FormLabel><FormControl><Textarea placeholder="Detalhes adicionais do problema para a ordem de serviço. Se vazio, usará a descrição do defeito." className="resize-y min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <Button type="submit" className="w-full" disabled={isSubmitting}>Criar Ordem de Serviço</Button>
        </form>
      </Form>
    </>
  );
}