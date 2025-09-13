import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ServiceOrderDetails {
  id: string;
  created_at: string;
  updated_at: string;
  status: string;
  issue_description?: string;
  service_details?: string;
  parts_cost?: number;
  service_cost?: number;
  total_amount?: number;
  guarantee_terms?: string;
  customers: {
    id: string;
    name: string;
    phone?: string;
    address?: string;
    email?: string;
  };
  devices: {
    id: string;
    brand: string;
    model: string;
    serial_number?: string;
    defect_description?: string;
    password_info?: string;
    checklist?: string[];
  };
}

export function ServiceOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading: isSessionLoading } = useSession();
  const [serviceOrder, setServiceOrder] = useState<ServiceOrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSessionLoading && user && id) {
      fetchServiceOrderDetails(id);
    } else if (!isSessionLoading && !user) {
      navigate('/login');
    } else if (!id) {
      showError("ID da Ordem de Serviço não fornecido.");
      navigate('/service-orders');
    }
  }, [id, user, isSessionLoading, navigate]);

  const fetchServiceOrderDetails = async (orderId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_orders')
        .select(`
          *,
          customers (id, name, phone, address, email),
          devices (id, brand, model, serial_number, defect_description, password_info, checklist)
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      if (!data) {
        showError("Ordem de Serviço não encontrada.");
        navigate('/service-orders');
        return;
      }
      setServiceOrder(data as ServiceOrderDetails);
    } catch (error: any) {
      console.error("Erro ao buscar detalhes da Ordem de Serviço:", error);
      showError(`Erro ao carregar detalhes: ${error.message || "Tente novamente."}`);
      navigate('/service-orders');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <p className="text-center text-gray-600 dark:text-gray-400">Carregando detalhes da Ordem de Serviço...</p>;
  }

  if (!serviceOrder) {
    return <p className="text-center text-red-500">Ordem de Serviço não encontrada ou você não tem permissão para visualizá-la.</p>;
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'in_progress':
        return 'default';
      case 'ready':
        return 'success';
      case 'completed':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/service-orders')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <CardTitle className="text-3xl">Ordem de Serviço #{serviceOrder.id.substring(0, 8)}</CardTitle>
            <CardDescription>Criada em: {format(new Date(serviceOrder.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</CardDescription>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={getStatusBadgeVariant(serviceOrder.status)}>
            {serviceOrder.status === 'pending' && 'Pendente'}
            {serviceOrder.status === 'in_progress' && 'Em Progresso'}
            {serviceOrder.status === 'ready' && 'Pronto'}
            {serviceOrder.status === 'completed' && 'Concluído'}
            {serviceOrder.status === 'cancelled' && 'Cancelado'}
            {!['pending', 'in_progress', 'ready', 'completed', 'cancelled'].includes(serviceOrder.status) && serviceOrder.status}
          </Badge>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" /> Editar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {/* Customer Details */}
        <div>
          <h3 className="text-xl font-semibold mb-2">Dados do Cliente</h3>
          <p><strong>Nome:</strong> {serviceOrder.customers.name}</p>
          {serviceOrder.customers.phone && <p><strong>Telefone:</strong> {serviceOrder.customers.phone}</p>}
          {serviceOrder.customers.email && <p><strong>Email:</strong> {serviceOrder.customers.email}</p>}
          {serviceOrder.customers.address && <p><strong>Endereço:</strong> {serviceOrder.customers.address}</p>}
        </div>

        {/* Device Details */}
        <div>
          <h3 className="text-xl font-semibold mb-2">Dados do Aparelho</h3>
          <p><strong>Marca:</strong> {serviceOrder.devices.brand}</p>
          <p><strong>Modelo:</strong> {serviceOrder.devices.model}</p>
          {serviceOrder.devices.serial_number && <p><strong>Número de Série/IMEI:</strong> {serviceOrder.devices.serial_number}</p>}
          {serviceOrder.devices.defect_description && <p><strong>Defeito Relatado:</strong> {serviceOrder.devices.defect_description}</p>}
          {serviceOrder.devices.password_info && <p><strong>Informações de Senha:</strong> {serviceOrder.devices.password_info}</p>}
          {serviceOrder.devices.checklist && serviceOrder.devices.checklist.length > 0 && (
            <div>
              <p className="font-semibold mt-2">Checklist:</p>
              <ul className="list-disc list-inside ml-4">
                {serviceOrder.devices.checklist.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Service Order Details */}
        <div>
          <h3 className="text-xl font-semibold mb-2">Detalhes do Serviço</h3>
          {serviceOrder.issue_description && <p><strong>Descrição do Problema:</strong> {serviceOrder.issue_description}</p>}
          {serviceOrder.service_details && <p><strong>Detalhes do Serviço:</strong> {serviceOrder.service_details}</p>}
          {serviceOrder.parts_cost !== undefined && <p><strong>Custo de Peças:</strong> R$ {serviceOrder.parts_cost.toFixed(2)}</p>}
          {serviceOrder.service_cost !== undefined && <p><strong>Custo do Serviço:</strong> R$ {serviceOrder.service_cost.toFixed(2)}</p>}
          {serviceOrder.total_amount !== undefined && <p><strong>Valor Total:</strong> R$ {serviceOrder.total_amount.toFixed(2)}</p>}
          {serviceOrder.guarantee_terms && <p><strong>Termos de Garantia:</strong> {serviceOrder.guarantee_terms}</p>}
          <p><strong>Última Atualização:</strong> {format(new Date(serviceOrder.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
        </div>
      </CardContent>
    </Card>
  );
}