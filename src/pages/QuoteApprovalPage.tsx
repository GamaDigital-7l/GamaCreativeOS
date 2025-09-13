import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SignaturePad } from '@/components/service-orders/SignaturePad';
import { Button } from '@/components/ui/button';

// Simplified type for public view
interface QuoteDetails {
  id: string;
  created_at: string;
  status: string;
  approval_status: string;
  issue_description?: string;
  service_details?: string;
  total_amount?: number;
  photos?: string[];
  customers: { name: string; };
  devices: { brand: string; model: string; };
}

export default function QuoteApprovalPage() {
  const { id } = useParams<{ id: string }>();
  const [quote, setQuote] = useState<QuoteDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) {
      setError("ID do orçamento não fornecido.");
      setIsLoading(false);
      return;
    }
    fetchQuoteDetails(id);
  }, [id]);

  const fetchQuoteDetails = async (orderId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_orders')
        .select(`id, created_at, status, approval_status, issue_description, service_details, total_amount, photos, customers(name), devices(brand, model)`)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      setQuote(data as QuoteDetails);
    } catch (err: any) {
      setError("Orçamento não encontrado ou inválido.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproval = async (signature: string) => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('service_orders')
        .update({
          approval_status: 'approved',
          status: 'in_progress', // Automatically move to 'in_progress'
          customer_signature: signature,
          approved_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
      showSuccess("Orçamento aprovado com sucesso!");
      fetchQuoteDetails(id); // Refresh data
    } catch (err: any) {
      showError("Erro ao aprovar o orçamento.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleRejection = async () => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('service_orders')
        .update({
          approval_status: 'rejected',
          status: 'cancelled', // Or another status you prefer
        })
        .eq('id', id);
      if (error) throw error;
      showSuccess("Orçamento recusado.");
      fetchQuoteDetails(id); // Refresh data
    } catch (err: any) {
      showError("Erro ao recusar o orçamento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (error || !quote) {
    return <div className="flex h-screen items-center justify-center text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 flex items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Orçamento de Serviço</CardTitle>
          <CardDescription>OS ID: {quote.id.substring(0, 8)}... | Data: {format(new Date(quote.created_at), 'dd/MM/yyyy', { locale: ptBR })}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold">Cliente:</h3>
            <p>{quote.customers.name}</p>
          </div>
          <div>
            <h3 className="font-semibold">Aparelho:</h3>
            <p>{quote.devices.brand} {quote.devices.model}</p>
          </div>
          <div>
            <h3 className="font-semibold">Problema Relatado:</h3>
            <p>{quote.issue_description || 'Não especificado.'}</p>
          </div>
          <div>
            <h3 className="font-semibold">Serviço Proposto:</h3>
            <p>{quote.service_details || 'Diagnóstico pendente.'}</p>
          </div>
          {quote.photos && quote.photos.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Fotos do Aparelho:</h3>
              <div className="grid grid-cols-3 gap-2">
                {quote.photos.map((url, idx) => <a href={url} target="_blank" rel="noreferrer"><img key={idx} src={url} alt={`Foto ${idx+1}`} className="rounded-md h-24 w-full object-cover" /></a>)}
              </div>
            </div>
          )}
          <div className="text-2xl font-bold text-right border-t pt-4">
            Valor Total: R$ {(quote.total_amount || 0).toFixed(2)}
          </div>

          {quote.approval_status === 'pending_approval' ? (
            <div className="border-t pt-4 space-y-4">
              <p className="text-sm text-center">Ao assinar e aprovar, você concorda com os termos de serviço e o valor apresentado.</p>
              <SignaturePad onSave={handleApproval} />
              <div className="text-center">
                <Button variant="link" className="text-red-500" onClick={handleRejection} disabled={isSubmitting}>Recusar Orçamento</Button>
              </div>
            </div>
          ) : quote.approval_status === 'approved' ? (
            <div className="flex items-center justify-center gap-2 text-green-600 border-t pt-4">
              <CheckCircle className="h-8 w-8" />
              <p className="text-xl font-bold">Orçamento Aprovado!</p>
            </div>
          ) : (
             <div className="flex items-center justify-center gap-2 text-red-600 border-t pt-4">
              <XCircle className="h-8 w-8" />
              <p className="text-xl font-bold">Orçamento Recusado.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}