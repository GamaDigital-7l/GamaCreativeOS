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
import { Loader2 } from "lucide-react";

const warrantyTemplates = {
  "90dias": "Garantia de 90 dias para o serviço prestado e peças substituídas, cobrindo defeitos de fabricação e de instalação. Não cobre danos por mau uso, quedas ou contato com líquidos.",
  "30dias": "Garantia de 30 dias para o serviço prestado. Peças não inclusas na garantia.",
  "semgarantia": "Serviço prestado sem garantia.",
};

const formSchema = z.object({
  service_order_template: z.string().default("default"),
  default_guarantee_terms: z.string().optional(),
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
          form.reset(data);
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