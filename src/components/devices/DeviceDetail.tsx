import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2, Loader2, Smartphone, User, Tag, Lock, ListChecks, Wrench } from 'lucide-react'; // Adicionado Wrench icon
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

interface DeviceDetails {
  id: string;
  created_at: string;
  brand: string;
  model: string;
  serial_number?: string;
  defect_description?: string;
  password_info?: string;
  checklist?: string[];
  customers: {
    id: string;
    name: string;
  };
}

export function DeviceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading: isSessionLoading } = useSession();
  const [device, setDevice] = useState<DeviceDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isSessionLoading && user && id) {
      fetchDeviceDetails(id);
    } else if (!isSessionLoading && !user) {
      navigate('/login');
    } else if (!id) {
      showError("ID do Dispositivo não fornecido.");
      navigate('/devices');
    }
  }, [id, user, isSessionLoading, navigate]);

  const fetchDeviceDetails = async (deviceId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('devices')
        .select(`
          id,
          created_at,
          brand,
          model,
          serial_number,
          defect_description,
          password_info,
          checklist,
          customers (id, name)
        `)
        .eq('id', deviceId)
        .eq('user_id', user?.id) // Ensure user can only see their own devices
        .single();

      if (error) throw error;
      if (!data) {
        showError("Dispositivo não encontrado.");
        navigate('/devices');
        return;
      }
      setDevice(data as DeviceDetails);
    } catch (error: any) {
      console.error("Erro ao buscar detalhes do dispositivo:", error);
      showError(`Erro ao carregar detalhes: ${error.message || "Tente novamente."}`);
      navigate('/devices');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDevice = async () => {
    if (!device || !user) {
      showError("Não foi possível deletar o dispositivo. Tente novamente.");
      return;
    }

    setIsDeleting(true);
    try {
      // Check if device is linked to any service orders
      const { count: serviceOrdersCount, error: serviceOrdersError } = await supabase
        .from('service_orders')
        .select('id', { count: 'exact' })
        .eq('device_id', device.id);

      if (serviceOrdersError) throw serviceOrdersError;

      if (serviceOrdersCount > 0) {
        showError("Não é possível deletar este dispositivo. Ele está associado a ordens de serviço.");
        return;
      }

      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', device.id)
        .eq('user_id', user.id); // Ensure only user's own devices can be deleted

      if (error) throw error;

      showSuccess("Dispositivo deletado com sucesso!");
      navigate('/devices');
    } catch (error: any) {
      console.error("Erro ao deletar dispositivo:", error);
      showError(`Erro ao deletar dispositivo: ${error.message || "Tente novamente."}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-gray-600 dark:text-gray-400">Carregando detalhes do dispositivo...</p>
      </div>
    );
  }

  if (!device) {
    return <p className="text-center text-red-500">Dispositivo não encontrado ou você não tem permissão para visualizá-lo.</p>;
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-4">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/devices')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <CardTitle className="text-3xl flex items-center gap-2"><Smartphone className="h-7 w-7 text-primary" /> {device.brand} {device.model}</CardTitle>
            <CardDescription>Criado em: {format(new Date(device.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</CardDescription>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/devices/${device.id}/edit`}>
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
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente este dispositivo.
                  Se o dispositivo estiver associado a ordens de serviço, a exclusão não será permitida.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteDevice} disabled={isDeleting}>
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
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-muted-foreground" />
          <p><strong>Cliente:</strong> {device.customers?.name || 'N/A'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-muted-foreground" />
          <p><strong>Marca:</strong> {device.brand}</p>
        </div>
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-muted-foreground" />
          <p><strong>Modelo:</strong> {device.model}</p>
        </div>
        {device.serial_number && (
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-muted-foreground" />
            <p><strong>Número de Série/IMEI:</strong> {device.serial_number}</p>
          </div>
        )}
        {device.defect_description && (
          <div className="flex items-start gap-2">
            <Wrench className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
            <p><strong>Defeito Relatado:</strong> {device.defect_description}</p>
          </div>
        )}
        {device.password_info && (
          <div className="flex items-start gap-2">
            <Lock className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
            <p><strong>Informações de Senha:</strong> {device.password_info}</p>
          </div>
        )}
        {device.checklist && device.checklist.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ListChecks className="h-5 w-5 text-muted-foreground" />
              <p className="font-semibold">Checklist de Entrada:</p>
            </div>
            <ul className="list-disc list-inside ml-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4">
              {device.checklist.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}