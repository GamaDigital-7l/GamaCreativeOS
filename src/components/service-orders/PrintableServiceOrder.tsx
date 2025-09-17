import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError } from '@/utils/toast';
import { Loader2, Printer, CheckCircle, XCircle, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// Define a more comprehensive type for the data needed
interface PrintableData {
  serviceOrder: {
    id: string;
    created_at: string;
    status: string;
    issue_description?: string;
    service_details?: string;
    total_amount?: number; // Only total_amount for customer view
    guarantee_terms?: string;
    customer_signature?: string;
    approved_at?: string;
    client_checklist?: Record<string, 'ok' | 'not_working'>;
    is_untestable?: boolean;
    casing_status?: 'good' | 'scratched' | 'damaged' | null;
  };
  customer: {
    name: string;
    phone?: string;
    address?: string;
    email?: string;
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
  settings: {
    service_order_template: string;
    default_guarantee_terms?: string;
    company_logo_url?: string;
    company_name?: string;
    company_phone?: string;
    company_address?: string;
    company_cnpj?: string;
    company_slogan?: string;
  };
  customFieldValues: {
    value: string;
    custom_field_id: string;
    service_order_custom_fields: {
      field_name: string;
      field_type: string;
      order_index: number;
    } | null;
  }[];
}

interface PrintableServiceOrderProps {
  printMode: 'client_only' | 'store_client';
  paperFormat: 'a4' | 'receipt';
}

export function PrintableServiceOrder({ printMode, paperFormat }: PrintableServiceOrderProps) {
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
          .select(`
            id, created_at, status, issue_description, service_details, total_amount,
            guarantee_terms, customer_signature, approved_at, client_checklist, is_untestable, casing_status,
            customers(*), 
            devices(*), 
            service_order_field_values (value, custom_field_id, service_order_custom_fields (field_name, field_type, order_index))
          `)
          .eq('id', id)
          .single();
        if (error) throw error;

        const { data: settingsData } = await supabase
          .from('user_settings')
          .select('service_order_template, default_guarantee_terms, company_logo_url, company_name, company_phone, company_address, company_cnpj, company_slogan')
          .eq('id', user.id)
          .single();

        setData({
          serviceOrder: serviceOrderData,
          customer: serviceOrderData.customers,
          device: serviceOrderData.devices,
          settings: settingsData || { service_order_template: 'default', default_guarantee_terms: "Não há termos de garantia padrão definidos." },
          customFieldValues: serviceOrderData.service_order_field_values || [],
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

  const { serviceOrder, customer, device, settings, customFieldValues } = data;

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
  const finalGuaranteeTerms = serviceOrder.guarantee_terms || settings.default_guarantee_terms || "Não há termos de garantia padrão definidos para esta ordem de serviço.";

  // Group custom field values by field_name and sort by order_index
  const groupedCustomFields = customFieldValues
    .filter(fv => fv.service_order_custom_fields) // Ensure field definition exists
    .sort((a, b) => (a.service_order_custom_fields?.order_index || 0) - (b.service_order_custom_fields?.order_index || 0))
    .reduce((acc, fieldValue) => {
      const fieldName = fieldValue.service_order_custom_fields?.field_name;
      if (fieldName) {
        if (!acc[fieldName]) {
          acc[fieldName] = [];
        }
        acc[fieldName].push(fieldValue.value);
      }
      return acc;
    }, {} as Record<string, string[]>);

  const renderCustomFields = () => {
    if (Object.keys(groupedCustomFields).length === 0) return null;
    return (
      <section>
        <h2 className="text-lg font-semibold border-b pb-1 mb-2">Informações Adicionais</h2>
        {Object.entries(groupedCustomFields).map(([fieldName, values]) => (
          <p key={fieldName}><strong>{fieldName}:</strong> {values.join(', ')}</p>
        ))}
      </section>
    );
  };

  const getCasingStatusLabel = (status: 'good' | 'scratched' | 'damaged' | null | undefined) => {
    switch (status) {
      case 'good': return 'Bom Estado';
      case 'scratched': return 'Arranhado';
      case 'damaged': return 'Amassado/Quebrado';
      default: return 'N/A';
    }
  };

  const renderClientChecklist = () => {
    if (serviceOrder.is_untestable) {
      return (
        <section className="mt-4">
          <h2 className="text-lg font-semibold border-b pb-1 mb-2">Checklist do Cliente</h2>
          <div className="flex items-center gap-2 text-orange-700">
            <PowerOff className="h-5 w-5" />
            <p>Aparelho entrou desligado / não testável. Checklist não aplicável.</p>
          </div>
        </section>
      );
    }
    
    const hasClientChecklist = serviceOrder.client_checklist && Object.keys(serviceOrder.client_checklist).length > 0;
    const hasCasingStatus = serviceOrder.casing_status;

    if (!hasClientChecklist && !hasCasingStatus) return null;

    return (
      <section className="mt-4">
        <h2 className="text-lg font-semibold border-b pb-1 mb-2">Checklist do Cliente</h2>
        {hasClientChecklist && (
          <ul className="list-disc list-inside ml-4 grid grid-cols-2 gap-x-4 text-sm">
            {Object.entries(serviceOrder.client_checklist || {}).map(([item, status], index) => (
              <li key={index} className={cn("flex items-center gap-1", status === 'ok' ? 'text-green-600' : 'text-red-600')}>
                {status === 'ok' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                {item}: {status === 'ok' ? 'Funciona' : 'Não Funciona'}
              </li>
            ))}
          </ul>
        )}
        {hasCasingStatus && (
          <p className="mt-2"><strong>Carcaça:</strong> {getCasingStatusLabel(serviceOrder.casing_status)}</p>
        )}
      </section>
    );
  };

  const renderCompanyHeader = (copyType: 'client' | 'store' | 'single', isReceipt: boolean = false) => (
    <div className={cn("text-center", isReceipt ? "pb-2 border-b border-dashed border-gray-500 mb-2" : "pb-4 border-b border-gray-300")}>
      {settings.company_logo_url && (
        <img src={settings.company_logo_url} alt="Logo da Empresa" className={cn("mx-auto mb-2", isReceipt ? "max-h-10" : "max-h-20")} />
      )}
      <h1 className={cn("font-bold", isReceipt ? "text-sm" : "text-2xl")}>{settings.company_name || "SUA LOJA AQUI"}</h1>
      {settings.company_slogan && <p className={cn("mt-1", isReceipt ? "text-xs" : "text-sm text-gray-700")}>{settings.company_slogan}</p>}
      <p className={cn("mt-1", isReceipt ? "text-xs" : "text-sm text-gray-700")}>
        {settings.company_address && `${settings.company_address} | `}
        {settings.company_phone && `Tel: ${settings.company_phone}`}
        {settings.company_cnpj && ` | CNPJ: ${settings.company_cnpj}`}
      </p>
      <h2 className={cn("font-bold mt-2", isReceipt ? "text-sm" : "text-xl")}>ORDEM DE SERVIÇO</h2>
      {copyType !== 'single' && <p className={cn("font-bold mt-1", isReceipt ? "text-xs" : "text-md")}>VIA {copyType.toUpperCase()}</p>}
    </div>
  );

  const renderDefaultTemplate = (copyType: 'client' | 'store' | 'single') => (
    <div className="max-w-4xl mx-auto p-8 space-y-6 border rounded-lg bg-white text-gray-800 mb-8">
      {renderCompanyHeader(copyType)}

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
          <p><strong>Defeito Relatado:</strong> {serviceOrder.issue_description}</p>
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

      {renderClientChecklist()}

      {renderCustomFields()}

      <section>
        <h2 className="text-lg font-semibold border-b pb-1 mb-2">Serviço Proposto</h2>
        <p className="mb-2">{serviceOrder.service_details || 'N/A'}</p>
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

  const renderCompactTemplate = (copyType: 'client' | 'store' | 'single') => (
    <div className="max-w-2xl mx-auto p-6 space-y-4 border rounded-lg bg-white text-gray-800 text-sm mb-8">
      {renderCompanyHeader(copyType)}

      <section>
        <h2 className="font-semibold border-b pb-1 mb-1">Cliente</h2>
        <p>Nome: {customer.name}</p>
        <p>Tel: {customer.phone || 'N/A'}</p>
      </section>

      <section>
        <h2 className="font-semibold border-b pb-1 mb-1">Dispositivo</h2>
        <p>Marca/Modelo: {device.brand} {device.model}</p>
        <p>Série/IMEI: {device.serial_number || 'N/A'}</p>
        <p>Defeito: {serviceOrder.issue_description}</p>
      </section>

      {renderClientChecklist()}

      {renderCustomFields()}

      <section>
        <h2 className="font-semibold border-b pb-1 mb-1">Serviço Proposto</h2>
        <p>{serviceOrder.service_details || 'N/A'}</p>
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

  const renderDetailedTemplate = (copyType: 'client' | 'store' | 'single') => (
    <div className="max-w-5xl mx-auto p-10 space-y-8 border-2 border-black bg-white text-gray-900 mb-8">
      <header className="text-center pb-6 border-b-2 border-black">
        {settings.company_logo_url && (
          <img src={settings.company_logo_url} alt="Logo da Empresa" className="mx-auto mb-4 max-h-24" />
        )}
        <h1 className="text-4xl font-extrabold text-blue-700">{settings.company_name || "SUA LOJA AQUI"}</h1>
        {settings.company_slogan && <p className="text-md text-gray-700 mt-2">{settings.company_slogan}</p>}
        <p className="text-md text-gray-700 mt-2">
          {settings.company_address && `${settings.company_address} | `}
          {settings.company_phone && `Telefone: ${settings.company_phone}`}
          {settings.company_cnpj && ` | CNPJ: ${settings.company_cnpj}`}
        </p>
        <h2 className="text-3xl font-bold mt-4">ORDEM DE SERVIÇO DETALHADA</h2>
        {copyType !== 'single' && <p className="text-lg font-bold mt-2">VIA {copyType.toUpperCase()}</p>}
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
          <p className="col-span-2"><strong>Defeito Relatado:</strong> {serviceOrder.issue_description || 'N/A'}</p>
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

      {renderClientChecklist()}
      {renderCustomFields()}

      <section className="text-md">
        <h3 className="text-xl font-bold border-b border-gray-500 pb-1 mb-2">Serviço Proposto</h3>
        <p className="mb-3"><strong>Descrição do Serviço:</strong> {serviceOrder.service_details || 'N/A'}</p>
      </section>

      <section className="flex justify-end text-md">
        <div className="w-1/2 space-y-2 text-right">
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

  const renderReceiptTemplate = () => (
    <div className="w-[80mm] mx-auto p-2 text-xs font-sans text-gray-900 leading-tight">
      {renderCompanyHeader('single', true)}

      <section className="mb-2">
        <p><strong>OS ID:</strong> {serviceOrder.id.substring(0, 8)}</p>
        <p><strong>Data:</strong> {format(new Date(serviceOrder.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
        <p><strong>Status:</strong> {serviceOrder.status}</p>
      </section>

      <section className="mb-2 border-t border-dashed border-gray-500 pt-2">
        <p><strong>Cliente:</strong> {customer.name}</p>
        <p><strong>Telefone:</strong> {customer.phone || 'N/A'}</p>
      </section>

      <section className="mb-2 border-t border-dashed border-gray-500 pt-2">
        <p><strong>Aparelho:</strong> {device.brand} {device.model}</p>
        <p><strong>IMEI/Série:</strong> {device.serial_number || 'N/A'}</p>
        <p><strong>Defeito:</strong> {serviceOrder.issue_description}</p>
        <p><strong>Serviço:</strong> {serviceOrder.service_details || 'N/A'}</p>
      </section>

      <section className="mb-2 border-t border-dashed border-gray-500 pt-2 text-right">
        <p><strong>Total:</strong> R$ {(serviceOrder.total_amount || 0).toFixed(2)}</p>
      </section>

      <footer className="border-t border-dashed border-gray-500 pt-2 text-center">
        <p className="text-[0.6rem] text-gray-600">{finalGuaranteeTerms.substring(0, 100)}...</p>
        <p className="mt-2">Obrigado!</p>
      </footer>
    </div>
  );

  const renderContent = (copyType: 'client' | 'store' | 'single') => {
    switch (settings.service_order_template) {
      case 'compact':
        return renderCompactTemplate(copyType);
      case 'detailed':
        return renderDetailedTemplate(copyType);
      case 'default':
      default:
        return renderDefaultTemplate(copyType);
    }
  };

  return (
    <div className="font-sans text-gray-800">
      {paperFormat === 'receipt' ? (
        renderReceiptTemplate()
      ) : (
        <div className="p-4">
          {printMode === 'client_only' && renderContent('single')}
          {printMode === 'store_client' && (
            <>
              {renderContent('client')}
              <div className="border-b-4 border-dashed border-gray-400 my-8 print:my-4 print:border-b-2 print:h-0.5 print:break-after-page"></div>
              {renderContent('store')}
            </>
          )}
        </div>
      )}
    </div>
  );
}