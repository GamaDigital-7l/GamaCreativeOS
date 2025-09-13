import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteServiceOrder = async () => {
    if (!serviceOrder || !user) {
      showError("Não foi possível deletar a Ordem de Serviço. Tente novamente.");
      return;
    }

    setIsDeleting(true);
    try {
      const { customer_id, device_id } = serviceOrder;

      // 1. Delete the service order
      const { error: serviceOrderError } = await supabase
        .from('service_orders')
        .delete()
        .eq('id', serviceOrder.id);

      if (serviceOrderError) throw serviceOrderError;

      // 2. Check and delete device if it's not linked to other service orders
      if (device_id) {
        const { count: deviceServiceOrdersCount, error: deviceCountError } = await supabase
          .from('service_orders')
          .select('id', { count: 'exact' })
          .eq('device_id', device_id);

        if (deviceCountError) throw deviceCountError;

        if (deviceServiceOrdersCount === 0) {
          const { error: deviceDeleteError } = await supabase
            .from('devices')
            .delete()
            .eq('id', device_id);
          if (deviceDeleteError) throw deviceDeleteError;
        }
      }

      // 3. Check and delete customer if not linked to other devices or service orders
      if (customer_id) {
        const { count: customerDevicesCount, error: customerDevicesError } = await supabase
          .from('devices')
          .select('id', { count: 'exact' })
          .eq('customer_id', customer_id);

        if (customerDevicesError) throw customerDevicesError;

        const { count: customerServiceOrdersCount, error: customerServiceOrdersError } = await supabase
          .from('service_orders')
          .select('id', { count: 'exact' })
          .eq('customer_id', customer_id);

        if (customerServiceOrdersError) throw customerServiceOrdersError;

        if (customerDevicesCount === 0 && customerServiceOrdersCount === 0) {
          const { error: customerDeleteError } = await supabase
            .from('customers')
            .delete()
            .eq('id', customer_id);
          if (customerDeleteError) throw customerDeleteError;
        }
      }

      showSuccess("Ordem de Serviço deletada com sucesso!");
      navigate('/service-orders');
    } catch (error: any) {
      console.error("Erro ao deletar Ordem de Serviço:", error);
      showError(`Erro ao deletar Ordem de Serviço: ${error.message || "Tente novamente."}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-gray-600 dark:text-gray-400">Carregando detalhes da Ordem de Serviço...</p>
      </div>
    );
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
          <Button variant="outline" size="sm" asChild>
            <Link to={`/service-orders/${serviceOrder.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" /> Editar
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isDeleting}>
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Deletar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza que deseja deletar?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente esta Ordem de Serviço e, se não houver outras associações, também o aparelho e o cliente relacionados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteServiceOrder} disabled={isDeleting}>
                  {isDeleting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Deletar"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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