import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SaleData {
  id: string;
  created_at: string;
  device_brand: string;
  device_model: string;
  imei_serial: string;
  sale_price: number;
  payment_method?: string;
  warranty_days?: number;
  warranty_policy?: string;
  customers: { name: string; phone?: string; } | null;
}

export function PrintableSaleReceipt() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<SaleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const { data: saleData, error } = await supabase
          .from('sales')
          .select(`*, customers(name, phone)`)
          .eq('id', id)
          .single();
        if (error) throw error;
        setData(saleData as SaleData);
      } catch (err: any) {
        showError(`Erro ao carregar dados: ${err.message}`);
        navigate(`/sales/${id}`);
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
    return <div className="p-8 text-center text-red-500">Dados da venda não encontrados.</div>;
  }

  return (
    <div className="font-sans text-gray-800">
      <div className="p-4 bg-gray-100 text-center print:hidden">
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" /> Imprimir Recibo
        </Button>
      </div>
      <div className="max-w-2xl mx-auto p-8">
        <div className="border-2 border-black p-6 space-y-6">
          <header className="text-center space-y-2 pb-4 border-b-2 border-black">
            <h1 className="text-3xl font-bold">SUA LOJA AQUI</h1>
            <p className="text-sm">Seu Endereço, 123 - Sua Cidade | Seu Telefone: (XX) XXXX-XXXX</p>
            <h2 className="text-2xl font-semibold pt-2">Recibo de Venda</h2>
          </header>

          <section className="flex justify-between text-sm">
            <p><strong>Recibo Nº:</strong> {data.id.substring(0, 8)}</p>
            <p><strong>Data:</strong> {format(new Date(data.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold border-b border-black pb-1 mb-2">Cliente</h3>
            <p><strong>Nome:</strong> {data.customers?.name || 'Não informado'}</p>
            <p><strong>Telefone:</strong> {data.customers?.phone || 'Não informado'}</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold border-b border-black pb-1 mb-2">Produto Vendido</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1">Descrição</th>
                  <th className="text-right py-1">Valor</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-1">
                    {data.device_brand} {data.device_model}
                    <br />
                    <span className="text-xs text-gray-600">IMEI/Série: {data.imei_serial}</span>
                  </td>
                  <td className="text-right py-1 align-top">R$ {data.sale_price.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="flex justify-end pt-2 border-t border-black">
            <div className="w-1/2 space-y-2 text-right">
              <p><strong>Forma de Pagamento:</strong> {data.payment_method || 'N/A'}</p>
              <p className="font-bold text-xl"><strong>Total:</strong> R$ {data.sale_price.toFixed(2)}</p>
            </div>
          </section>

          <section className="pt-4">
            <h3 className="text-lg font-semibold mb-2">Termos de Garantia</h3>
            <p className="text-xs text-gray-600">
              Garantia de <strong>{data.warranty_days || 'N/A'} dias</strong>. {data.warranty_policy || 'Consulte a política de garantia da loja.'}
            </p>
          </section>

          <footer className="pt-12 text-center">
            <div className="w-2/3 mx-auto">
              <div className="border-t border-black pt-2">
                <p className="text-sm">Assinatura do Cliente</p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}