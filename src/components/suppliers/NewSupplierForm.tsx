import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Loader2, PlusCircle, Building } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório."),
  contact_person: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido.").optional().or(z.literal('')),
  address: z.string().optional(),
});

export function NewSupplierForm() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", contact_person: "", phone: "", email: "", address: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('suppliers').insert(values);
      if (error) throw error;
      showSuccess("Fornecedor criado com sucesso!");
      navigate('/suppliers');
    } catch (error: any) {
      showError(`Erro: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Building className="h-6 w-6 text-primary" /> Detalhes do Fornecedor</h2>
        <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome do Fornecedor</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="contact_person" render={({ field }) => (<FormItem><FormLabel>Pessoa de Contato</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Telefone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Endereço</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : <><PlusCircle className="h-4 w-4 mr-2" /> Salvar Fornecedor</>}
        </Button>
      </form>
    </Form>
  );
}