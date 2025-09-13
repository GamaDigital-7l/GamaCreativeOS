import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2, Loader2, Phone, Mail, MapPin, User } from 'lucide-react'; // Adicionado User icon
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

interface CustomerDetails {
  id: string;
  created_at: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading: isSessionLoading } = useSession();
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isSessionLoading && user && id) {
      fetchCustomerDetails(id);
    } else if (!isSessionLoading && !user) {
      navigate('/login');
    } else if (!id) {
      showError("ID do Cliente não fornecido.");
      navigate('/customers');
    }
  }, [id, user, isSessionLoading, navigate]);

  const fetchCustomerDetails = async (customerId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select(`id, created_at, name, phone, email, address`)
        .eq('id', customerId)
        .eq('user_id', user?.id) // Ensure user can only see their own customers
        .single();

      if (error) throw error;
      if (!data) {
        showError("Cliente não encontrado.");
        navigate('/customers');
        return;
      }
      setCustomer(data as CustomerDetails);
    } catch (error: any) {
      console.error("Erro ao buscar detalhes do cliente:", error);
      showError(`Erro ao carregar detalhes: ${error.message || "Tente novamente."}`);
      navigate('/customers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customer || !user) {
      showError("Não foi possível deletar o cliente. Tente novamente.");
      return;
    }

    setIsDeleting(true);
    try {
      // Check if customer is linked to any devices or service orders
      const { count: devicesCount, error: devicesError } = await supabase
        .from('devices')
        .select('id', { count: 'exact' })
        .eq('customer_id', customer.id);

      if (devicesError) throw devicesError;

      const { count: serviceOrdersCount, error: serviceOrdersError } = await supabase
        .from('service_orders')
        .select('id', { count: 'exact' })
        .eq('customer_id', customer.id);

      if (serviceOrdersError) throw serviceOrdersError;

      if (devicesCount > 0 || serviceOrdersCount > 0) {
        showError("Não é possível deletar este cliente. Ele está associado a dispositivos ou ordens de serviço.");
        return;
      }

      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customer.id)
        .eq('user_id', user.id); // Ensure only user's own customers can be deleted

      if (error) throw error;

      showSuccess("Cliente deletado com sucesso!");
      navigate('/customers');
    } catch (error: any) {
      console.error("Erro ao deletar cliente:", error);
      showError(`Erro ao deletar cliente: ${error.message || "Tente novamente."}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-gray-600 dark:text-gray-400">Carregando detalhes do cliente...</p>
      </div>
    );
  }

  if (!customer) {
    return <p className="text-center text-red-500">Cliente não encontrado ou você não tem permissão para visualizá-lo.</p>;
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-4">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/customers')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <CardTitle className="text-3xl flex items-center gap-2"><User className="h-7 w-7 text-primary" /> {customer.name}</CardTitle>
            <CardDescription>Criado em: {format(new Date(customer.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</CardDescription>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/customers/${customer.id}/edit`}>
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
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente este cliente.
                  Se o cliente estiver associado a dispositivos ou ordens de serviço, a exclusão não será permitida.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteCustomer} disabled={isDeleting}>
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
          <Phone className="h-5 w-5 text-muted-foreground" />
          <p><strong>Telefone:</strong> {customer.phone || 'N/A'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <p><strong>Email:</strong> {customer.email || 'N/A'}</p>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-muted-foreground" />
          <p><strong>Endereço:</strong> {customer.address || 'N/A'}</p>
        </div>
      </CardContent>
    </Card>
  );
}