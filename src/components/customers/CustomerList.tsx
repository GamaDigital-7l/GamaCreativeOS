import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Eye, Search, X, Plus, Loader2, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
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

interface Customer {
  id: string;
  created_at: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

export function CustomerList() {
  const { user, isLoading: isSessionLoading } = useSession();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isSessionLoading && user) {
      fetchCustomers();
    } else if (!isSessionLoading && !user) {
      setIsLoading(false);
      navigate('/login');
    }
  }, [user, isSessionLoading, searchTerm, navigate]);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('customers')
        .select(`id, created_at, name, phone, email, address`)
        .eq('user_id', user?.id) // Filter by current user's ID
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(
          `name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      setCustomers(data as Customer[]);
    } catch (error: any) {
      console.error("Erro ao buscar clientes:", error);
      showError(`Erro ao carregar clientes: ${error.message || "Tente novamente."}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    setIsDeleting(true);
    try {
      // Check if customer is linked to any devices or service orders
      const { count: devicesCount, error: devicesError } = await supabase
        .from('devices')
        .select('id', { count: 'exact' })
        .eq('customer_id', customerId);

      if (devicesError) throw devicesError;

      const { count: serviceOrdersCount, error: serviceOrdersError } = await supabase
        .from('service_orders')
        .select('id', { count: 'exact' })
        .eq('customer_id', customerId);

      if (serviceOrdersError) throw serviceOrdersError;

      if (devicesCount > 0 || serviceOrdersCount > 0) {
        showError("Não é possível deletar este cliente. Ele está associado a dispositivos ou ordens de serviço.");
        return;
      }

      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId)
        .eq('user_id', user?.id); // Ensure only user's own customers can be deleted

      if (error) throw error;

      setCustomers(prev => prev.filter(customer => customer.id !== customerId));
      showSuccess("Cliente deletado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao deletar cliente:", error);
      showError(`Erro ao deletar cliente: ${error.message || "Tente novamente."}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-2xl">Clientes</CardTitle>
        <Button asChild>
          <Link to="/new-customer">
            <Plus className="h-4 w-4 mr-2" /> Novo Cliente
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="relative flex-grow mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-8"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {isLoading ? (
          <p className="text-center text-gray-600 dark:text-gray-400">Carregando clientes...</p>
        ) : !user ? (
          <p className="text-center text-red-500">Você precisa estar logado para ver os clientes.</p>
        ) : customers.length === 0 ? (
          <p className="text-center text-gray-600 dark:text-gray-400">Nenhum cliente encontrado com os filtros aplicados.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.phone || 'N/A'}</TableCell>
                    <TableCell>{customer.email || 'N/A'}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{customer.address || 'N/A'}</TableCell>
                    <TableCell>{format(new Date(customer.created_at), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                    <TableCell className="text-right flex justify-end space-x-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/customers/${customer.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" disabled={isDeleting}>
                            {isDeleting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
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
                            <AlertDialogAction onClick={() => handleDeleteCustomer(customer.id)} disabled={isDeleting}>
                              {isDeleting ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Deletando...
                                </>
                              ) : (
                                "Deletar"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}