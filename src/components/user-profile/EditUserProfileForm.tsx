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
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/integrations/supabase/SessionContext";
import { showSuccess, showError } from "@/utils/toast";
import { useNavigate } from "react-router-dom";
import { Loader2, Save, User, Image } from "lucide-react"; // Adicionado Image icon

const formSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  avatar_url: z.string().url({ message: "URL de avatar inválida." }).optional().or(z.literal('')),
});

export function EditUserProfileForm() {
  const navigate = useNavigate();
  const { user } = useSession();
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      avatar_url: "",
    },
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchUserProfile = async () => {
      setIsLoadingData(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(`first_name, last_name, avatar_url`)
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
          throw error;
        }

        form.reset({
          first_name: data?.first_name || "",
          last_name: data?.last_name || "",
          avatar_url: data?.avatar_url || "",
        });
      } catch (error: any) {
        console.error("Erro ao carregar perfil para edição:", error);
        showError(`Erro ao carregar dados do perfil: ${error.message || "Tente novamente."}`);
        navigate('/profile');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchUserProfile();
  }, [user, navigate, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      showError("Você precisa estar logado para editar seu perfil.");
      navigate('/login');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: values.first_name || null,
          last_name: values.last_name || null,
          avatar_url: values.avatar_url || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' }); // Use upsert to insert if not exists, update if exists

      if (error) throw error;

      showSuccess("Perfil atualizado com sucesso!");
      navigate('/profile'); // Redirect back to the profile detail page
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error);
      showError(`Erro ao atualizar perfil: ${error.message || "Tente novamente."}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-gray-600 dark:text-gray-400">Carregando dados do perfil...</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><User className="h-6 w-6 text-primary" /> Dados do Perfil</h2>
        <FormField
          control={form.control}
          name="first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primeiro Nome</FormLabel>
              <FormControl>
                <Input placeholder="Seu primeiro nome" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="last_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sobrenome</FormLabel>
              <FormControl>
                <Input placeholder="Seu sobrenome" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="avatar_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><Image className="h-4 w-4" /> URL do Avatar</FormLabel>
              <FormControl>
                <Input placeholder="https://exemplo.com/avatar.jpg" {...field} />
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
            <><Save className="h-4 w-4 mr-2" /> Atualizar Perfil</>
          )}
        </Button>
      </form>
    </Form>
  );
}