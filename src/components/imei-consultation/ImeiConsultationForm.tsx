"use client";

import React, { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Search, Smartphone, FileText, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError, showSuccess } from '@/utils/toast';

const formSchema = z.object({
  imei: z.string().min(14, "IMEI deve ter pelo menos 14 dígitos.").max(16, "IMEI deve ter no máximo 16 dígitos.").regex(/^\d+$/, "IMEI deve conter apenas números."),
});

interface ImeiConsultationResult {
  status: 'clean' | 'restricted' | 'stolen' | 'unknown';
  details: string;
  last_updated?: string;
  // Add more fields as per the external API response
}

export function ImeiConsultationForm() {
  const { user } = useSession();
  const [isConsulting, setIsConsulting] = useState(false);
  const [result, setResult] = useState<ImeiConsultationResult | null>(null);
  const [consultationError, setConsultationError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      imei: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      showError("Você precisa estar logado para consultar um IMEI.");
      return;
    }

    setIsConsulting(true);
    setResult(null);
    setConsultationError(null);

    try {
      const { data, error } = await supabase.functions.invoke('consult-imei', {
        body: { imei: values.imei },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data as ImeiConsultationResult);
      showSuccess("Consulta de IMEI realizada com sucesso!");

    } catch (error: any) {
      console.error("Erro ao consultar IMEI:", error);
      setConsultationError(error.message || "Erro desconhecido ao consultar IMEI. Tente novamente.");
      showError(error.message || "Erro ao consultar IMEI.");
    } finally {
      setIsConsulting(false);
    }
  }

  const getStatusIcon = (status: ImeiConsultationResult['status']) => {
    switch (status) {
      case 'clean': return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'restricted': return <AlertCircle className="h-8 w-8 text-orange-500" />;
      case 'stolen': return <XCircle className="h-8 w-8 text-red-500" />;
      case 'unknown': return <AlertCircle className="h-8 w-8 text-gray-500" />;
      default: return <Smartphone className="h-8 w-8 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: ImeiConsultationResult['status']) => {
    switch (status) {
      case 'clean': return 'Livre de Restrições';
      case 'restricted': return 'Com Restrições';
      case 'stolen': return 'Roubado/Perdido';
      case 'unknown': return 'Status Desconhecido';
      default: return 'Não Consultado';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Smartphone className="h-6 w-6 text-primary" /> Consulta de IMEI</CardTitle>
        <CardDescription>
          Insira o número do IMEI do aparelho para verificar seu status e histórico.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="imei"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><FileText className="h-4 w-4" /> Número do IMEI</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 123456789012345" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isConsulting}>
              {isConsulting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Consultando...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" /> Consultar IMEI
                </>
              )}
            </Button>
          </form>
        </Form>

        {consultationError && (
          <div className="p-4 bg-red-100 text-red-700 rounded-md flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            <p className="font-medium">{consultationError}</p>
          </div>
        )}

        {result && (
          <Card className="border-l-4 border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(result.status)}
                Status do IMEI: {getStatusLabel(result.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Detalhes:</strong> {result.details}</p>
              {result.last_updated && <p><strong>Última Atualização:</strong> {result.last_updated}</p>}
              <p className="text-sm text-muted-foreground mt-4">
                *Este laudo é baseado em dados de terceiros e pode não ser 100% preciso ou atualizado em tempo real.
              </p>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}