import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from "qrcode.react";

interface LabelData {
  id: string;
  customers: { name: string };
  devices: { brand: string; model: string; defect_description?: string; password_info?: string };
}

export function PrintableServiceOrderLabel() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<LabelData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const { data: osData, error } = await supabase
          .from('service_orders')
          .select(`id, customers(name), devices(brand, model, defect_description, password_info)`)
          .eq('id', id)
          .single();
        if (error) throw error;
        setData(osData as LabelData);
      } catch (err: any) {
        showError(`Erro ao carregar dados: ${err.message}`);
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
    return <div className="p-8 text-center text-red-500">Dados da OS não encontrados.</div>;
  }

  const detailUrl = `${window.location.origin}/service-orders/${data.id}`;

  const renderPasswordPattern = () => (
    <svg width="60" height="40" viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="3" fill="black" />
      <circle cx="30" cy="10" r="3" fill="black" />
      <circle cx="50" cy="10" r="3" fill="black" />
      <circle cx="10" cy="30" r="3" fill="black" />
      <circle cx="30" cy="30" r="3" fill="black" />
      <circle cx="50" cy="30" r="3" fill="black" />
    </svg>
  );

  return (
    <div className="font-sans text-black">
      <div className="p-4 bg-gray-100 text-center print:hidden">
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" /> Imprimir Etiqueta
        </Button>
      </div>
      
      {/* A4 Page Wrapper for Centering */}
      <div className="w-[210mm] h-[297mm] flex items-start justify-center pt-4 bg-gray-50 print:bg-white print:h-auto print:w-auto">
        {/* 80mm Thermal Label Simulation */}
        <div className="w-[80mm] p-2 border border-dashed border-gray-400 bg-white print:border-none">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-grow space-y-1">
              <h1 className="text-lg font-bold leading-tight">OS: {data.id.substring(0, 8)}</h1>
              <p className="text-xs leading-tight"><strong>Cliente:</strong> {data.customers.name}</p>
              <p className="text-xs leading-tight"><strong>Aparelho:</strong> {data.devices.brand} {data.devices.model}</p>
            </div>
            <div className="flex-shrink-0">
              <QRCodeSVG value={detailUrl} size={64} />
            </div>
          </div>
          <div className="mt-2 pt-1 border-t border-black">
            <p className="text-xs font-bold">Defeito Relatado:</p>
            <p className="text-xs leading-tight">{data.devices.defect_description || 'Não informado'}</p>
          </div>
          <div className="mt-2 pt-1 border-t border-black">
            <p className="text-xs font-bold">Senha/Padrão:</p>
            {data.devices.password_info ? (
              <p className="text-xs leading-tight">{data.devices.password_info}</p>
            ) : (
              <div className="flex justify-center mt-1">
                {renderPasswordPattern()}
              </div>
            )}
          </div>
          <div className="mt-2 pt-1 border-t border-black">
            <p className="text-xs font-bold">Orçamento:</p>
            <div className="h-8"></div>
          </div>
        </div>
      </div>
    </div>
  );
}