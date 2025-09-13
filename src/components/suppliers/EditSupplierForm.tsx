import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/integrations/supabase/SessionContext";
import { showSuccess, showError } from "@/utils/toast";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, Save, Building, User, Phone, Mail, MapPin } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório."),
  contact_person: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido.").optional().or(z.literal('')),
  address: z.string().optional(),
});

export function EditSupplierForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSession();
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", contact_person: "", phone: "", email: "", address: "" },
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!id) {
      showError("ID do Fornecedor não fornecido.");
      navigate('/suppliers');
      return;
    }

    const fetchSupplier = async () => {
      setIsLoadingData(true);
      try {
        const { data, error } = await supabase
          .from('suppliers')
          .select(`id, name, contact_person, phone, email, address`)
          .eq('id', id)
          .eq('user_id', user.id) // Ensure user can only edit their own suppliers
          .single();

        if (error) throw error;
        if (!data) {
          showError("Fornecedor não encontrado.");
          navigate('/suppliers');
          return;
        }

        form.reset(data);
      } catch (error: any) {
        console.error("Erro ao carregar fornecedor para edição:", error);
        showError(`Erro ao carregar dados: ${error.message || "Tente novamente."}`);
        navigate('/suppliers');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchSupplier();
  }, [id, user, navigate, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      showError("Você precisa estar logado para editar um fornecedor.");
      navigate('/login');
      return;
    }
    if (!id) {
      showError("ID do Fornecedor não fornecido.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({
          name: values.name,
          contact_person: values.contact_person,
          phone: values.phone,
          email: values.email,
          address: values.address,
        })
        .eq('id', id)
        .eq('user_id', user.id); // Ensure only user's own suppliers can be updated

      if (error) throw error;

      showSuccess("Fornecedor atualizado com sucesso!");
      navigate(`/suppliers/${id}`); // Redirect back to the detail page
    } catch (error: any) {
      console.error("Erro ao atualizar fornecedor:", error);
      showError(`Erro ao atualizar fornecedor: ${error.message || "Tente novamente."}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-gray-600 dark:text-gray-400">Carregando dados do fornecedor...</p>
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
              <FormLabel className="flex items-center gap-2"><Building className="h-4 w-4" /> Nome do Fornecedor</FormLabel>
              <FormControl>
                <Input placeholder="Nome do fornecedor" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contact_person"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><User className="h-4 w-4" /> Pessoa de Contato</FormLabel>
              <FormControl>
                <Input placeholder="Nome do contato" {...field} />
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
              <FormLabel className="flex items-center gap-2"><Phone className="h-4 w-4" /> Telefone</FormLabel>
              <FormControl>
                <Input placeholder="(XX) XXXXX-XXXX" {...field} />
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
              <FormLabel className="flex items-center gap-2"><Mail className="h-4 w-4" /> Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="email@exemplo.com" {...field} />
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
              <FormLabel className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Endereço</FormLabel>
              <FormControl>
                <Input placeholder="Rua, Número, Bairro, Cidade" {...field} />
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
            <><Save className="h-4 w-4 mr-2" /> Atualizar Fornecedor</>
          )}
        </Button>
      </form>
    </Form>
  );
}