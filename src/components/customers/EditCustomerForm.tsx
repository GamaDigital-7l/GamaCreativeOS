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
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/integrations/supabase/SessionContext";
import { showSuccess, showError } from "@/utils/toast";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, { message: "Nome do cliente é obrigatório." }),
  phone: z.string().optional(),
  address: z.string().optional(),
  email: z.string().email({ message: "Email inválido." }).optional().or(z.literal('')),
});

export function EditCustomerForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSession();
  const [isLoadingData, setIsLoadingData] = useState(true);
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

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!id) {
      showError("ID do Cliente não fornecido.");
      navigate('/customers');
      return;
    }

    const fetchCustomer = async () => {
      setIsLoadingData(true);
      try {
        const { data, error } = await supabase
          .from('customers')
          .select(`id, name, phone, address, email`)
          .eq('id', id)
          .eq('user_id', user.id) // Ensure user can only edit their own customers
          .single();

        if (error) throw error;
        if (!data) {
          showError("Cliente não encontrado.");
          navigate('/customers');
          return;
        }

        form.reset(data);
      } catch (error: any) {
        console.error("Erro ao carregar cliente para edição:", error);
        showError(`Erro ao carregar dados: ${error.message || "Tente novamente."}`);
        navigate('/customers');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchCustomer();
  }, [id, user, navigate, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      showError("Você precisa estar logado para editar um cliente.");
      navigate('/login');
      return;
    }
    if (!id) {
      showError("ID do Cliente não fornecido.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('customers')
        .update({
          name: values.name,
          phone: values.phone,
          address: values.address,
          email: values.email,
        })
        .eq('id', id)
        .eq('user_id', user.id); // Ensure only user's own customers can be updated

      if (error) throw error;

      showSuccess("Cliente atualizado com sucesso!");
      navigate(`/customers/${id}`); // Redirect back to the detail page
    } catch (error: any) {
      console.error("Erro ao atualizar cliente:", error);
      showError(`Erro ao atualizar cliente: ${error.message || "Tente novamente."}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-gray-600 dark:text-gray-400">Carregando dados do cliente...</p>
      </div>
    );
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
              Atualizando...
            </>
          ) : (
            "Atualizar Cliente"
          )}
        </Button>
      </form>
    </Form>
  );
}