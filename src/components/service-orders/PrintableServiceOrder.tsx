import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError } from '@/utils/toast';
import { Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Define a more comprehensive type for the data needed
interface PrintableData {
  serviceOrder: {
    id: string;
    created_at: string;
    status: string;
    issue_description?: string;
    service_details?: string;
    parts_cost?: number;
    service_cost?: number;
    total_amount?: number;
    guarantee_terms?: string;
    customer_signature?: string;
    approved_at?: string;
  };
  customer: {
    name: string;
    phone?: string;
    address?: string;
  };
  device: {
    id: string;
    brand: string;
    model: string;
    serial_number?: string;
    defect_description?: string;
    password_info?: string;
    checklist?: Record<string, string>;
  };
  items: {
    quantity_used: number;
    price_at_time: number;
    inventory_items: {
      name: string;
    } | null;
  }[];
  settings: {
    service_order_template: string;
    default_guarantee_terms?: string;
  };
}

export function PrintableServiceOrder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSession();
  const [data, setData] = useState<PrintableData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;

    const fetchData = async () => {
      try {
        const { data: serviceOrderData, error } = await supabase
          .from('service_orders')
          .select(`*, customers(*), devices(*), service_order_inventory_items(*, inventory_items(name))`)
          .eq('id', id)
          .single();
        if (error) throw error;

        const { data: settingsData } = await supabase
          .from('user_settings')
          .select('service_order_template, default_guarantee_terms')
          .eq('id', user.id)
          .single();

        setData({
          serviceOrder: serviceOrderData,
          customer: serviceOrderData.customers,
          device: serviceOrderData.devices,
          items: serviceOrderData.service_order_inventory_items,
          settings: settingsData || { service_order_template: 'default', default_guarantee_terms: "Não há termos de garantia padrão definidos." },
        });
      } catch (err: any) {
        showError(`Erro ao carregar dados para impressão: ${err.message}`);
        navigate(`/service-orders/${id}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, user, navigate]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-red-500">Não foi possível carregar os dados da Ordem de Serviço.</div>;
  }

  const { serviceOrder, customer, device, items, settings } = data;

  const renderPasswordPattern = () => (
    <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      {/* Row 1 */}
      <circle cx="10" cy="10" r="3" fill="black" />
      <circle cx="30" cy="10" r="3" fill="black" />
      <circle cx="50" cy="10" r="3" fill="black" />
      {/* Row 2 */}
      <circle cx="10" cy="30" r="3" fill="black" />
      <circle cx="30" cy="30" r="3" fill="black" />
      <circle cx="50" cy="30" r="3" fill="black" />
      {/* Row 3 */}
      <circle cx="10" cy="50" r="3" fill="black" />
      <circle cx="30" cy="50" r="3" fill="black" />
      <circle cx="50" cy="50" r="3" fill="black" />
    </svg>
  );

  // Determine which guarantee terms to use
  const finalGuaranteeTerms = serviceOrder.guarantee_terms || settings.default_guarantee_terms || "Não há termos de garantia definidos para esta ordem de serviço.";

  const renderDefaultTemplate = () => (
    <div className="max-w-4xl mx-auto p-8 space-y-6 border rounded-lg bg-white text-gray-800">
      <header className="flex justify-between items-start pb-4 border-b border-gray-300">
        <div>
          <h1 className="text-2xl font-bold">Ordem de Serviço</h1>
          <p className="text-sm text-gray-500">ID: {serviceOrder.id.substring(0, 8)}</p>
        </div>
        <div className="text-right">
          <p><strong>Data:</strong> {format(new Date(serviceOrder.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
          <p><strong>Status:</strong> {serviceOrder.status}</p>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-semibold border-b pb-1 mb-2">Cliente</h2>
          <p><strong>Nome:</strong> {customer.name}</p>
          <p><strong>Telefone:</strong> {customer.phone || 'N/A'}</p>
          <p><strong>Endereço:</strong> {customer.address || 'N/A'}</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold border-b pb-1 mb-2">Dispositivo</h2>
          <p><strong>Marca/Modelo:</strong> {device.brand} {device.model}</p>
          <p><strong>Série/IMEI:</strong> {device.serial_number || 'N/A'}</p>
          <p><strong>Defeito Relatado:</strong> {device.defect_description}</p>
          <p className="mt-2"><strong>Senha/Padrão:</strong></p>
          {device.password_info ? (
            <p>{device.password_info}</p>
          ) : (
            <div className="flex justify-start mt-1">
              {renderPasswordPattern()}
            </div>
          )}
          {device.checklist && Object.keys(device.checklist).length > 0 && (
            <div className="mt-4">
              <p className="font-semibold">Checklist de Entrada:</p>
              <ul className="list-disc list-inside ml-4 text-sm">
                {Object.entries(device.checklist).map(([key, status], index) => (
                  <li key={index}>{key.replace(/_/g, ' ')}: {status}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold border-b pb-1 mb-2">Serviço e Peças</h2>
        <p className="mb-2"><strong>Serviço Realizado:</strong> {serviceOrder.service_details || 'N/A'}</p>
        {items.length > 0 && (
          <table className="w-full text-sm mt-4">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-1 pr-2">Peça/Material</th>
                <th className="text-center py-1 px-2">Qtd.</th>
                <th className="text-right py-1 pl-2">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, index: number) => (
                <tr key={index} className="border-b border-gray-200 last:border-b-0">
                  <td className="py-1 pr-2">{item.inventory_items?.name || 'Item'}</td>
                  <td className="text-center py-1 px-2">{item.quantity_used}</td>
                  <td className="text-right py-1 pl-2">R$ {(item.price_at_time * item.quantity_used).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="flex justify-end">
        <div className="w-1/2 space-y-1 text-right">
          <p className="font-bold text-lg border-t pt-1 mt-1 border-gray-300"><strong>Total:</strong> R$ {(serviceOrder.total_amount || 0).toFixed(2)}</p>
        </div>
      </section>

      <section className="pt-4 border-t border-gray-300">
        <h2 className="text-lg font-semibold mb-2">Termos de Garantia</h2>
        <p className="text-xs text-gray-600">{finalGuaranteeTerms}</p>
      </section>

      <footer className="pt-8 text-center">
        {serviceOrder.customer_signature && (
          <div className="mb-4">
            <img src={serviceOrder.customer_signature} alt="Assinatura do cliente" className="mx-auto max-h-24" />
            <p className="text-sm text-muted-foreground mt-1">
              Assinatura do Cliente
              {serviceOrder.approved_at && ` em ${format(new Date(serviceOrder.approved_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`}
            </p>
          </div>
        )}
        <div className="w-2/3 mx-auto">
          <div className="border-t border-black pt-2">
            <p className="text-sm">Assinatura do Técnico</p>
          </div>
        </div>
      </footer>
    </div>
  );

  const renderCompactTemplate = () => (
    <div className="max-w-2xl mx-auto p-6 space-y-4 border rounded-lg bg-white text-gray-800 text-sm">
      <header className="flex justify-between items-start pb-3 border-b border-gray-300">
        <div>
          <h1 className="text-xl font-bold">Ordem de Serviço</h1>
          <p>ID: {serviceOrder.id.substring(0, 8)}</p>
        </div>
        <div className="text-right">
          <p>Data: {format(new Date(serviceOrder.created_at), 'dd/MM/yyyy', { locale: ptBR })}</p>
          <p>Status: {serviceOrder.status}</p>
        </div>
      </header>

      <section>
        <h2 className="font-semibold border-b pb-1 mb-1">Cliente</h2>
        <p>Nome: {customer.name}</p>
        <p>Tel: {customer.phone || 'N/A'}</p>
      </section>

      <section>
        <h2 className="font-semibold border-b pb-1 mb-1">Dispositivo</h2>
        <p>Marca/Modelo: {device.brand} {device.model}</p>
        <p>Série/IMEI: {device.serial_number || 'N/A'}</p>
        <p>Defeito: {device.defect_description}</p>
      </section>

      <section>
        <h2 className="font-semibold border-b pb-1 mb-1">Serviço</h2>
        <p>{serviceOrder.service_details || 'N/A'}</p>
        {items.length > 0 && (
          <div className="mt-2">
            <p className="font-semibold">Peças:</p>
            <ul className="list-disc list-inside ml-2">
              {items.map((item: any, index: number) => (
                <li key={index}>{item.inventory_items?.name || 'Item'} (x{item.quantity_used})</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="flex justify-end pt-2 border-t border-gray-300">
        <p className="font-bold text-lg">Total: R$ {(serviceOrder.total_amount || 0).toFixed(2)}</p>
      </section>

      <section className="pt-2 border-t border-gray-300">
        <h2 className="font-semibold mb-1">Termos de Garantia</h2>
        <p className="text-xs text-gray-600">{finalGuaranteeTerms}</p>
      </section>

      <footer className="pt-6 text-center">
        {serviceOrder.customer_signature && (
          <div className="mb-3">
            <img src={serviceOrder.customer_signature} alt="Assinatura do cliente" className="mx-auto max-h-20" />
            <p className="text-xs text-muted-foreground mt-1">Assinatura do Cliente</p>
          </div>
        )}
        <div className="w-2/3 mx-auto border-t pt-1">
          <p>Assinatura do Técnico</p>
        </div>
      </footer>
    </div>
  );

  const renderDetailedTemplate = () => (
    <div className="max-w-5xl mx-auto p-10 space-y-8 border-2 border-black bg-white text-gray-900">
      <header className="text-center pb-6 border-b-2 border-black">
        <h1 className="text-4xl font-extrabold text-blue-700">SUA LOJA AQUI</h1>
        <p className="text-md text-gray-700 mt-2">Seu Endereço Completo, Cidade - UF | Telefone: (XX) XXXX-XXXX | Email: contato@suaempresa.com</p>
        <h2 className="text-3xl font-bold mt-4">ORDEM DE SERVIÇO DETALHADA</h2>
      </header>

      <section className="grid grid-cols-2 gap-x-12 gap-y-4 text-md">
        <div>
          <h3 className="text-xl font-bold border-b border-gray-500 pb-1 mb-2">Informações da OS</h3>
          <p><strong>OS ID:</strong> {serviceOrder.id}</p>
          <p><strong>Data de Abertura:</strong> {format(new Date(serviceOrder.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
          <p><strong>Status Atual:</strong> <span className="font-semibold text-blue-600">{serviceOrder.status.toUpperCase()}</span></p>
          {serviceOrder.approved_at && <p><strong>Data de Aprovação:</strong> {format(new Date(serviceOrder.approved_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>}
        </div>
        <div>
          <h3 className="text-xl font-bold border-b border-gray-500 pb-1 mb-2">Dados do Cliente</h3>
          <p><strong>Nome:</strong> {customer.name}</p>
          <p><strong>Telefone:</strong> {customer.phone || 'N/A'}</p>
          <p><strong>Email:</strong> {customer.email || 'N/A'}</p>
          <p><strong>Endereço:</strong> {customer.address || 'N/A'}</p>
        </div>
      </section>

      <section className="text-md">
        <h3 className="text-xl font-bold border-b border-gray-500 pb-1 mb-2">Detalhes do Dispositivo</h3>
        <div className="grid grid-cols-2 gap-x-12 gap-y-2">
          <p><strong>Marca:</strong> {device.brand}</p>
          <p><strong>Modelo:</strong> {device.model}</p>
          <p><strong>Série/IMEI:</strong> {device.serial_number || 'N/A'}</p>
          <p className="col-span-2"><strong>Defeito Relatado:</strong> {device.defect_description || 'N/A'}</p>
          <p className="col-span-2"><strong>Informações de Senha:</strong> {device.password_info || 'N/A'}</p>
          {device.checklist && Object.keys(device.checklist).length > 0 && (
            <div className="col-span-2 mt-2">
              <p className="font-semibold">Checklist de Entrada:</p>
              <ul className="list-disc list-inside ml-4 grid grid-cols-2 gap-x-4">
                {Object.entries(device.checklist).map(([key, status], index) => (
                  <li key={index}>{key.replace(/_/g, ' ')}: {status}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="text-md">
        <h3 className="text-xl font-bold border-b border-gray-500 pb-1 mb-2">Serviços e Peças Utilizadas</h3>
        <p className="mb-3"><strong>Descrição do Serviço:</strong> {serviceOrder.service_details || 'N/A'}</p>
        {items.length > 0 && (
          <table className="w-full text-md border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th className="text-left py-2 px-3">Item/Peça</th>
                <th className="text-center py-2 px-3">Qtd.</th>
                <th className="text-right py-2 px-3">Preço Unit.</th>
                <th className="text-right py-2 px-3">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, index: number) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-2 px-3">{item.inventory_items?.name || 'Item Removido'}</td>
                  <td className="text-center py-2 px-3">{item.quantity_used}</td>
                  <td className="text-right py-2 px-3">R$ {item.price_at_time.toFixed(2)}</td>
                  <td className="text-right py-2 px-3">R$ {(item.price_at_time * item.quantity_used).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="flex justify-end text-md">
        <div className="w-1/2 space-y-2 text-right">
          <p><strong>Custo das Peças:</strong> R$ {(serviceOrder.parts_cost || 0).toFixed(2)}</p>
          <p><strong>Custo do Serviço:</strong> R$ {(serviceOrder.service_cost || 0).toFixed(2)}</p>
          <p className="font-bold text-2xl border-t border-black pt-2 mt-2"><strong>TOTAL GERAL:</strong> R$ {(serviceOrder.total_amount || 0).toFixed(2)}</p>
        </div>
      </section>

      <section className="pt-6 border-t-2 border-black text-md">
        <h3 className="text-xl font-bold mb-2">Termos de Garantia e Condições</h3>
        <p className="text-sm text-gray-700 leading-relaxed">{finalGuaranteeTerms}</p>
      </section>

      <footer className="pt-12 text-center text-md">
        {serviceOrder.customer_signature && (
          <div className="mb-6">
            <img src={serviceOrder.customer_signature} alt="Assinatura do cliente" className="mx-auto max-h-32 border border-gray-300 p-2" />
            <p className="text-sm text-muted-foreground mt-2">
              Assinatura do Cliente
              {serviceOrder.approved_at && ` em ${format(new Date(serviceOrder.approved_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`}
            </p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-12 mt-8">
          <div>
            <div className="border-t border-black pt-2">
              <p>Assinatura do Cliente</p>
            </div>
          </div>
          <div>
            <div className="border-t border-black pt-2">
              <p>Assinatura do Técnico</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-8">Documento gerado eletronicamente. Válido sem assinatura física se aprovado digitalmente.</p>
      </footer>
    </div>
  );

  const renderTemplate = () => {
    switch (settings.service_order_template) {
      case 'compact':
        return renderCompactTemplate();
      case 'detailed':
        return renderDetailedTemplate();
      case 'default':
      default:
        return renderDefaultTemplate();
    }
  };

  return (
    <div className="font-sans text-gray-800">
      <div className="p-4 bg-gray-100 text-center print:hidden">
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" /> Imprimir Ordem de Serviço
        </Button>
      </div>
      <div className="p-4">
        {renderTemplate()}
      </div>
    </div>
  );
}