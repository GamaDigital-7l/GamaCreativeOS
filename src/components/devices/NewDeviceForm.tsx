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
import { useNavigate } from "react-router-dom";
import { Loader2, PlusCircle, Smartphone, ListChecks, User, Tag, Lock, Wrench, Hash } from "lucide-react"; // Adicionado User, Tag, Lock, Wrench, Hash icons
import React, { useEffect, useState } from "react";

const checklistOptions = [
  "Tela intacta", "Tela trincada", "Carcaça intacta", "Carcaça com arranhões",
  "Carcaça amassada", "Bateria ok", "Bateria estufada", "Câmera ok",
  "Câmera com defeito", "Botões ok", "Botões com defeito", "Conector de carga ok",
  "Conector de carga com defeito", "Ligando", "Não ligando",
];

const formSchema = z.object({
  customer_id: z.string().uuid({ message: "Selecione um cliente válido." }),
  brand: z.string().min(2, { message: "Marca do aparelho é obrigatória." }),
  model: z.string().min(2, { message: "Modelo do aparelho é obrigatório." }),
  serial_number: z.string().optional(),
  defect_description: z.string().min(10, { message: "Descrição do defeito é obrigatória e deve ter pelo menos 10 caracteres." }),
  password_info: z.string().optional(),
  checklist: z.array(z.string()).optional(),
});

interface CustomerOption { id: string; name: string; }
interface NewDeviceFormProps {
  customerId?: string;
  onSuccess?: (device: { id: string; brand: string; model: string }) => void;
}

export function NewDeviceForm({ customerId, onSuccess }: NewDeviceFormProps) {
  const { user } = useSession();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_id: customerId || "",
      brand: "", model: "", serial_number: "", defect_description: "",
      password_info: "", checklist: [],
    },
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!customerId) { // Only fetch customers if one isn't provided
      setIsLoadingCustomers(true);
      supabase.from('customers').select('id, name').eq('user_id', user.id).order('name', { ascending: true })
        .then(({ data, error }) => {
          if (error) showError(`Erro ao carregar clientes: ${error.message}`);
          else setCustomers(data || []);
          setIsLoadingCustomers(false);
        });
    } else {
      setIsLoadingCustomers(false);
    }
  }, [user, navigate, customerId]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      showError("Você precisa estar logado para criar um dispositivo.");
      navigate('/login');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('devices')
        .insert({
          user_id: user.id,
          customer_id: values.customer_id,
          brand: values.brand,
          model: values.model,
          serial_number: values.serial_number,
          defect_description: values.defect_description,
          password_info: values.password_info,
          checklist: values.checklist,
        })
        .select('id, brand, model')
        .single();

      if (error) throw error;

      showSuccess("Dispositivo criado com sucesso!");
      form.reset();
      
      if (onSuccess) {
        onSuccess(data);
      } else {
        navigate('/devices');
      }
    } catch (error: any) {
      console.error("Erro ao criar dispositivo:", error);
      showError(`Erro ao criar dispositivo: ${error.message || "Tente novamente."}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingCustomers) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Smartphone className="h-6 w-6 text-primary" /> Dados do Dispositivo</h2>
        {!customerId && (
          <FormField
            control={form.control}
            name="customer_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2"><User className="h-4 w-4" /> Cliente</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger></FormControl>
                  <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField control={form.control} name="brand" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Tag className="h-4 w-4" /> Marca</FormLabel><FormControl><Input placeholder="Ex: Samsung, Apple" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="model" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Smartphone className="h-4 w-4" /> Modelo</FormLabel><FormControl><Input placeholder="Ex: Galaxy S21, iPhone 13" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="serial_number" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Hash className="h-4 w-4" /> Número de Série/IMEI</FormLabel><FormControl><Input placeholder="Opcional" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="defect_description" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Wrench className="h-4 w-4" /> Defeito Relatado</FormLabel><FormControl><Textarea placeholder="Descreva o problema..." className="resize-y min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="password_info" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Lock className="h-4 w-4" /> Senha/Padrão (Opcional)</FormLabel><FormControl><Textarea placeholder="Se fornecida pelo cliente." className="resize-y min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <h2 className="text-2xl font-bold mt-8 mb-4 flex items-center gap-2"><ListChecks className="h-6 w-6 text-primary" /> Checklist do Aparelho</h2>
        <FormField control={form.control} name="checklist" render={() => (<FormItem><div className="mb-4"><FormLabel className="text-base">Estado do Aparelho</FormLabel></div><div className="grid grid-cols-2 md:grid-cols-3 gap-4">{checklistOptions.map((item) => (<FormField key={item} control={form.control} name="checklist" render={({ field }) => (<FormItem key={item} className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked) => { return checked ? field.onChange([...(field.value || []), item]) : field.onChange(field.value?.filter((value) => value !== item)); }} /></FormControl><FormLabel className="font-normal">{item}</FormLabel></FormItem>)} />))}</div><FormMessage /></FormItem>)} />
        <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando...</> : <><PlusCircle className="h-4 w-4 mr-2" /> Criar Dispositivo</>}</Button>
      </form>
    </Form>
  );
}