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
  serviceOrder: any;
  customer: any;
  device: {
    id: string;
    brand: string;
    model: string;
    serial_number?: string;
    defect_description?: string;
    password_info?: string;
    checklist?: Record<string, string>; // Changed to Record<string, string>
  };
  items: any[];
  settings: any;
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
          .select('*')
          .eq('id', user.id)
          .single();

        setData({
          serviceOrder: serviceOrderData,
          customer: serviceOrderData.customers,
          device: serviceOrderData.devices,
          items: serviceOrderData.service_order_inventory_items,
          settings: settingsData || { service_order_template: 'default' },
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

  // For now, we only have one template. The structure is here to add more later.
  const renderTemplate = () => {
    switch (settings.service_order_template) {
      case 'compact':
      case 'detailed':
      default: // 'default' template
        return (
          <div className="max-w-4xl mx-auto p-8 space-y-6 border rounded-lg">
            <header className="flex justify-between items-start pb-4 border-b">
              <div>
                <h1 className="text-2xl font-bold">Ordem de Serviço</h1>
                <p className="text-sm text-gray-500">ID: {serviceOrder.id.substring(0, 8)}</p>
              </div>
              <div className="text-right">
                <p><strong>Data:</strong> {format(new Date(serviceOrder.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                <p><strong>Status:</strong> {serviceOrder.status}</p>
              </div>
            </header>

            <section className="grid grid-cols-2 gap-8">
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
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-1 pr-2">Peça/Material</th>
                      <th className="text-center py-1 px-2">Qtd.</th>
                      <th className="text-right py-1 pl-2">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item: any, index: number) => (
                      <tr key={index} className="border-b">
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
                <p className="font-bold text-lg border-t pt-1 mt-1"><strong>Total:</strong> R$ {(serviceOrder.total_amount || 0).toFixed(2)}</p>
              </div>
            </section>

            <section className="pt-4 border-t">
              <h2 className="text-lg font-semibold mb-2">Termos de Garantia</h2>
              <p className="text-xs text-gray-600">{serviceOrder.guarantee_terms}</p>
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
                <div className="border-t pt-2">
                  <p className="text-sm">Assinatura do Técnico</p>
                </div>
              </div>
            </footer>
          </div>
        );
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