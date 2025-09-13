import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WarrantyData {
  id: string;
  created_at: string;
  finalized_at?: string;
  service_details?: string;
  total_amount?: number;
  guarantee_terms?: string;
  warranty_days?: number;
  customers: { name: string; phone?: string; } | null;
  devices: { brand: string; model: string; serial_number?: string; } | null;
}

export default function PrintableServiceOrderWarrantyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<WarrantyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const { data: osData, error } = await supabase
          .from('service_orders')
          .select(`
            id,
            created_at,
            finalized_at,
            service_details,
            total_amount,
            guarantee_terms,
            warranty_days,
            customers(name, phone),
            devices(brand, model, serial_number)
          `)
          .eq('id', id)
          .single();
        if (error) throw error;
        setData(osData as WarrantyData);
      } catch (err: any) {
        showError(`Erro ao carregar dados da garantia: ${err.message}`);
        navigate(`/service-orders/${id}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-red-500">Dados da nota de garantia não encontrados.</div>;
  }

  const warrantyEndDate = data.finalized_at && data.warranty_days
    ? format(new Date(new Date(data.finalized_at).setDate(new Date(data.finalized_at).getDate() + data.warranty_days)), 'dd/MM/yyyy', { locale: ptBR })
    : 'N/A';

  return (
    <div className="font-sans text-gray-800">
      <div className="p-4 bg-gray-100 text-center print:hidden">
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" /> Imprimir Nota de Garantia
        </Button>
      </div>
      <div className="max-w-2xl mx-auto p-8">
        <div className="border-2 border-black p-6 space-y-6">
          <header className="text-center space-y-2 pb-4 border-b-2 border-black">
            <h1 className="text-3xl font-bold">SUA LOJA AQUI</h1>
            <p className="text-sm">Seu Endereço, 123 - Sua Cidade | Seu Telefone: (XX) XXXX-XXXX</p>
            <h2 className="text-2xl font-semibold pt-2">Nota de Garantia</h2>
          </header>

          <section className="flex justify-between text-sm">
            <p><strong>OS Nº:</strong> {data.id.substring(0, 8)}</p>
            <p><strong>Data de Finalização:</strong> {data.finalized_at ? format(new Date(data.finalized_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'N/A'}</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold border-b border-black pb-1 mb-2">Cliente</h3>
            <p><strong>Nome:</strong> {data.customers?.name || 'Não informado'}</p>
            <p><strong>Telefone:</strong> {data.customers?.phone || 'Não informado'}</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold border-b border-black pb-1 mb-2">Dispositivo</h3>
            <p><strong>Marca/Modelo:</strong> {data.devices?.brand} {data.devices?.model}</p>
            <p><strong>Série/IMEI:</strong> {data.devices?.serial_number || 'Não informado'}</p>
            <p><strong>Serviço Realizado:</strong> {data.service_details || 'Não informado'}</p>
          </section>

          <section className="pt-4">
            <h3 className="text-lg font-semibold mb-2">Detalhes da Garantia</h3>
            <p className="text-sm">
              Este serviço possui garantia de <strong>{data.warranty_days || 0} dias</strong> a partir da data de finalização.
            </p>
            <p className="text-sm">
              <strong>Válida até:</strong> {warrantyEndDate}
            </p>
            <p className="text-xs text-gray-600 mt-2">
              <strong>Termos:</strong> {data.guarantee_terms || 'Não há termos de garantia específicos definidos.'}
            </p>
          </section>

          <footer className="pt-12 text-center">
            <div className="w-2/3 mx-auto">
              <div className="border-t border-black pt-2">
                <p className="text-sm">Assinatura do Cliente</p>
              </div>
            </div>
            <p className="text-xs mt-4">Obrigado por escolher nossos serviços!</p>
          </footer>
        </div>
      </div>
    </div>
  );
}