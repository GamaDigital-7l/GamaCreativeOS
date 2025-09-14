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
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/integrations/supabase/SessionContext";
import { showSuccess, showError } from "@/utils/toast";
import { Loader2, Building, Phone, Mail, MapPin, FileText, Image as ImageIcon } from "lucide-react"; // Adicionado novos ícones
import { Input } from "@/components/ui/input"; // Importar Input

const warrantyTemplates = {
  "90dias": "Garantia de 90 dias para o serviço prestado e peças substituídas, cobrindo defeitos de fabricação e de instalação. Não cobre danos por mau uso, quedas ou contato com líquidos.",
  "30dias": "Garantia de 30 dias para o serviço prestado. Peças não inclusas na garantia.",
  "semgarantia": "Serviço prestado sem garantia.",
};

const formSchema = z.object({
  service_order_template: z.string().default("default"),
  default_guarantee_terms: z.string().optional(),
  // New company fields
  company_logo_url: z.string().url({ message: "URL de logo inválida." }).optional().or(z.literal('')),
  company_name: z.string().min(2, { message: "Nome da empresa é obrigatório." }).optional(),
  company_phone: z.string().optional(),
  company_address: z.string().optional(),
  company_cnpj: z.string().optional(),
  company_slogan: z.string().optional(),
});

export function SettingsForm() {
  const { user } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      service_order_template: "default",
      default_guarantee_terms: warrantyTemplates["90dias"],
      company_logo_url: "",
      company_name: "",
      company_phone: "",
      company_address: "",
      company_cnpj: "",
      company_slogan: "",
    },
  });

  useEffect(() => {
    if (!user) return;
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("user_settings")
          .select("*")
          .eq("id", user.id)
          .single();
        if (data) {
          form.reset({
            ...data,
            company_logo_url: data.company_logo_url || "",
            company_name: data.company_name || "",
            company_phone: data.company_phone || "",
            company_address: data.company_address || "",
            company_cnpj: data.company_cnpj || "",
            company_slogan: data.company_slogan || "",
          });
        } else if (error && error.code !== 'PGRST116') {
          throw error;
        }
      } catch (error: any) {
        showError("Erro ao carregar configurações.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [user, form]);

  const handleWarrantyTemplateChange = (key: keyof typeof warrantyTemplates) => {
    form.setValue("default_guarantee_terms", warrantyTemplates[key]);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("user_settings").upsert({
        id: user.id,
        ...values,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      showSuccess("Configurações salvas com sucesso!");
    } catch (error: any) {
      showError(`Erro ao salvar: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Building className="h-6 w-6 text-primary" /> Dados da Empresa</h2>
        <FormField
          control={form.control}
          name="company_logo_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> URL do Logo da Empresa</FormLabel>
              <FormControl><Input placeholder="https://suaempresa.com/logo.png" {...field} /></FormControl>
              <FormDescription>
                Insira a URL do logo da sua empresa para aparecer nas impressões.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="company_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><Building className="h-4 w-4" /> Nome da Empresa</FormLabel>
              <FormControl><Input placeholder="Sua Empresa Ltda." {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="company_slogan"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><FileText className="h-4 w-4" /> Slogan da Empresa (Opcional)</FormLabel>
              <FormControl><Input placeholder="Seu slogan aqui!" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="company_phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><Phone className="h-4 w-4" /> Telefone da Empresa</FormLabel>
              <FormControl><Input placeholder="(XX) XXXX-XXXX" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="company_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Endereço da Empresa</FormLabel>
              <FormControl><Input placeholder="Rua Exemplo, 123 - Cidade, UF" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="company_cnpj"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><FileText className="h-4 w-4" /> CNPJ da Empresa (Opcional)</FormLabel>
              <FormControl><Input placeholder="XX.XXX.XXX/XXXX-XX" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 mt-10"><FileText className="h-6 w-6 text-primary" /> Configurações da Ordem de Serviço</h2>
        <FormField
          control={form.control}
          name="service_order_template"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Modelo de Ordem de Serviço</FormLabel>
              <FormDescription>
                Escolha o layout para a impressão da sua Ordem de Serviço.
              </FormDescription>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl><RadioGroupItem value="default" /></FormControl>
                    <FormLabel className="font-normal">Padrão</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl><RadioGroupItem value="compact" /></FormControl>
                    <FormLabel className="font-normal">Compacto</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl><RadioGroupItem value="detailed" /></FormControl>
                    <FormLabel className="font-normal">Detalhado</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="default_guarantee_terms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Termos de Garantia Padrão</FormLabel>
              <FormDescription>
                Este texto será usado como padrão nas suas Ordens de Serviço.
              </FormDescription>
              <div className="flex gap-2 mb-2">
                <Button type="button" variant="outline" size="sm" onClick={() => handleWarrantyTemplateChange("90dias")}>90 Dias</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => handleWarrantyTemplateChange("30dias")}>30 Dias</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => handleWarrantyTemplateChange("semgarantia")}>Sem Garantia</Button>
              </div>
              <FormControl>
                <Textarea className="min-h-[120px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Configurações
        </Button>
      </form>
    </Form>
  );
}