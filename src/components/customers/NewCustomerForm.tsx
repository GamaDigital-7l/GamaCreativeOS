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
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/integrations/supabase/SessionContext";
import { showSuccess, showError } from "@/utils/toast";
import { useNavigate } from "react-router-dom";
import { Loader2, UserPlus } from "lucide-react";
import { useState } from "react";

const formSchema = z.object({
  name: z.string().min(2, { message: "Nome do cliente é obrigatório." }),
  phone: z.string().optional(),
  address: z.string().optional(),
  email: z.string().email({ message: "Email inválido." }).optional().or(z.literal('')),
});

interface NewCustomerFormProps {
  onSuccess?: (customer: { id: string; name: string }) => void;
}

export function NewCustomerForm({ onSuccess }: NewCustomerFormProps) {
  const { user } = useSession();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      showError("Você precisa estar logado para criar um cliente.");
      navigate('/login');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          user_id: user.id,
          name: values.name,
          phone: values.phone,
          address: values.address,
          email: values.email,
        })
        .select()
        .single();

      if (error) throw error;

      showSuccess("Cliente criado com sucesso!");
      form.reset();
      
      if (onSuccess) {
        onSuccess({ id: data.id, name: data.name });
      } else {
        navigate('/customers');
      }
    } catch (error: any) {
      console.error("Erro ao criar cliente:", error);
      showError(`Erro ao criar cliente: ${error.message || "Tente novamente."}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
        <FormField
          control={form.control}
          name="name"
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
          name="phone"
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
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço</FormLabel>
              <FormControl>
                <Textarea placeholder="Rua, Número, Bairro, Cidade" className="resize-y min-h-[80px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
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

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Criando...
            </>
          ) : (
            <><UserPlus className="h-4 w-4 mr-2" /> Criar Cliente</>
          )}
        </Button>
      </form>
    </Form>
  );
}