import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { Loader2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TradeInDetails {
  brand: string;
  model: string;
  imei_serial: string;
  value: number;
  condition?: string;
}

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
  trade_in_details?: TradeInDetails;
  customers: { name: string; phone?: string; } | null;
  settings: {
    company_logo_url?: string;
    company_name?: string;
    company_phone?: string;
    company_address?: string;
    company_cnpj?: string;
    company_slogan?: string;
  };
}

interface PrintableSaleReceiptProps {
  printMode: 'client_only' | 'store_client';
  paperFormat: 'a4' | 'a5' | 'receipt';
}

export function PrintableSaleReceipt({ printMode, paperFormat }: PrintableSaleReceiptProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<SaleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const { data: saleData, error: saleError } = await supabase
          .from('sales')
          .select(`*, customers(name, phone)`)
          .eq('id', id)
          .single();
        if (saleError) throw saleError;

        const { data: settingsData, error: settingsError } = await supabase
          .from('user_settings')
          .select('company_logo_url, company_name, company_phone, company_address, company_cnpj, company_slogan')
          .single();
        if (settingsError && settingsError.code !== 'PGRST116') throw settingsError; // PGRST116 means no rows found

        setData({
          ...saleData,
          settings: settingsData || {},
        } as SaleData);
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

  const { settings } = data;

  const warrantyEndDate = data.warranty_days && data.warranty_days > 0
    ? format(addDays(new Date(data.created_at), data.warranty_days), 'dd/MM/yyyy', { locale: ptBR })
    : 'N/A';

  const totalAmountDue = data.sale_price - (data.trade_in_details?.value || 0);

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
      <h2 className={cn("font-bold mt-2", isReceipt ? "text-sm" : "text-xl")}>RECIBO DE VENDA</h2>
      {copyType !== 'single' && <p className={cn("font-bold mt-1", isReceipt ? "text-xs" : "text-md")}>VIA {copyType.toUpperCase()}</p>}
    </div>
  );

  const renderReceiptContent = (copyType: 'client' | 'store' | 'single', isA5: boolean = false) => (
    <div className={cn(
      "p-6 space-y-6 bg-white text-gray-800",
      isA5 ? "max-w-md mx-auto border rounded-lg text-sm" : "max-w-2xl mx-auto border-2 border-black text-base"
    )}>
      {renderCompanyHeader(copyType, false)}

      <section className={cn("flex justify-between", isA5 ? "text-xs" : "text-sm")}>
        <p><strong>Recibo Nº:</strong> {data.id.substring(0, 8)}</p>
        <p><strong>Data:</strong> {format(new Date(data.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
      </section>

      <section>
        <h3 className={cn("font-semibold border-b pb-1 mb-2", isA5 ? "text-sm" : "text-lg")}>Cliente</h3>
        <p><strong>Nome:</strong> {data.customers?.name || 'Não informado'}</p>
        <p><strong>Telefone:</strong> {data.customers?.phone || 'N/A'}</p>
      </section>

      <section>
        <h3 className={cn("font-semibold border-b pb-1 mb-2", isA5 ? "text-sm" : "text-lg")}>Produto Vendido</h3>
        <table className={cn("w-full", isA5 ? "text-xs" : "text-sm")}>
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
            {data.trade_in_details && (
              <tr>
                <td className="py-1 text-red-600">
                  Aparelho de Entrada: {data.trade_in_details.brand} {data.trade_in_details.model}
                  <br />
                  <span className="text-xs text-gray-600">IMEI/Série: {data.trade_in_details.imei_serial}</span>
                </td>
                <td className="text-right py-1 align-top text-red-600">- R$ {data.trade_in_details.value.toFixed(2)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="flex justify-end pt-2 border-t border-black">
        <div className={cn("space-y-2 text-right", isA5 ? "w-full" : "w-1/2")}>
          <p><strong>Forma de Pagamento:</strong> {data.payment_method || 'N/A'}</p>
          <p className={cn("font-bold", isA5 ? "text-lg" : "text-xl")}><strong>Total a Pagar:</strong> R$ {totalAmountDue.toFixed(2)}</p>
        </div>
      </section>

      <section className="pt-4">
        <h3 className={cn("font-semibold mb-2", isA5 ? "text-sm" : "text-lg")}>Termos de Garantia</h3>
        <p className={cn("text-gray-600", isA5 ? "text-xs" : "text-sm")}>
          Garantia de <strong>{data.warranty_days || 'N/A'} dias</strong>. Válida até: <strong>{warrantyEndDate}</strong>
        </p>
        <p className={cn("text-gray-600 mt-1", isA5 ? "text-xs" : "text-sm")}>
          {data.warranty_policy || 'Consulte a política de garantia da loja.'}
        </p>
      </section>

      <footer className={cn("pt-12 text-center", isA5 ? "pt-8" : "")}>
        <div className={cn("mx-auto", isA5 ? "w-full" : "w-2/3")}>
          <div className="border-t border-black pt-2">
            <p className={cn("", isA5 ? "text-xs" : "text-sm")}>Assinatura do Cliente</p>
          </div>
        </div>
      </footer>
    </div>
  );

  const renderThermalReceipt = () => (
    <div className="w-[80mm] mx-auto p-2 text-xs font-sans text-gray-900 leading-tight">
      {renderCompanyHeader('single', true)}

      <section className="mb-2">
        <p><strong>Recibo ID:</strong> {data.id.substring(0, 8)}</p>
        <p><strong>Data:</strong> {format(new Date(data.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
      </section>

      <section className="mb-2 border-t border-dashed border-gray-500 pt-2">
        <p><strong>Cliente:</strong> {data.customers?.name || 'N/A'}</p>
        <p><strong>Telefone:</strong> {data.customers?.phone || 'N/A'}</p>
      </section>

      <section className="mb-2 border-t border-dashed border-gray-500 pt-2">
        <p><strong>Produto:</strong> {data.device_brand} {data.device_model}</p>
        <p><strong>IMEI/Série:</strong> {data.imei_serial}</p>
        {data.trade_in_details && (
          <p className="text-red-600"><strong>Entrada:</strong> {data.trade_in_details.brand} {data.trade_in_details.model} (-R$ {data.trade_in_details.value.toFixed(2)})</p>
        )}
      </section>

      <section className="mb-2 border-t border-dashed border-gray-500 pt-2 text-right">
        <p><strong>Total:</strong> R$ {totalAmountDue.toFixed(2)}</p>
        <p><strong>Pagamento:</strong> {data.payment_method || 'N/A'}</p>
      </section>

      <footer className="border-t border-dashed border-gray-500 pt-2 text-center">
        <p className="text-[0.6rem] text-gray-600">Garantia: {data.warranty_days || 'N/A'} dias. Válida até: {warrantyEndDate}</p>
        <p className="mt-2">Obrigado!</p>
      </footer>
    </div>
  );

  const renderContent = (copyType: 'client' | 'store' | 'single') => {
    switch (paperFormat) {
      case 'a4':
        return renderReceiptContent(copyType, false);
      case 'a5':
        return renderReceiptContent(copyType, true);
      case 'receipt':
        return renderThermalReceipt();
      default:
        return renderReceiptContent(copyType, false);
    }
  };

  return (
    <div className="font-sans text-gray-800">
      {paperFormat === 'receipt' ? (
        renderContent('single')
      ) : (
        <div className={cn("p-4", paperFormat === 'a5' && "w-[210mm] h-[297mm] flex items-start justify-center pt-4 bg-gray-50 print:bg-white print:h-auto print:w-auto")}>
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