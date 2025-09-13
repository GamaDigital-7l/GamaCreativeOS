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
import { Eye, Search, X, Plus, Loader2, Trash2, Smartphone } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Device {
  id: string;
  created_at: string;
  brand: string;
  model: string;
  serial_number?: string;
  customers: {
    id: string;
    name: string;
  };
}

interface CustomerOption {
  id: string;
  name: string;
}

export function DeviceList() {
  const { user, isLoading: isSessionLoading } = useSession();
  const navigate = useNavigate();
  const [devices, setDevices] = useState<Device[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isSessionLoading && user) {
      fetchCustomersForFilter();
      fetchDevices();
    } else if (!isSessionLoading && !user) {
      setIsLoading(false);
      navigate('/login');
    }
  }, [user, isSessionLoading, searchTerm, customerFilter, navigate]);

  const fetchCustomersForFilter = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name')
        .eq('user_id', user?.id)
        .order('name', { ascending: true });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      console.error("Erro ao buscar clientes para filtro:", error);
      showError(`Erro ao carregar clientes: ${error.message || "Tente novamente."}`);
    }
  };

  const fetchDevices = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('devices')
        .select(`
          id,
          created_at,
          brand,
          model,
          serial_number,
          customers (id, name)
        `)
        .eq('user_id', user?.id) // Ensure user can only see their own devices
        .order('created_at', { ascending: false });

      if (customerFilter !== 'all') {
        query = query.eq('customer_id', customerFilter);
      }

      if (searchTerm) {
        query = query.or(
          `brand.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%,serial_number.ilike.%${searchTerm}%,customers.name.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      setDevices(data as Device[]);
    } catch (error: any) {
      console.error("Erro ao buscar dispositivos:", error);
      showError(`Erro ao carregar dispositivos: ${error.message || "Tente novamente."}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    setIsDeleting(true);
    try {
      // Check if device is linked to any service orders
      const { count: serviceOrdersCount, error: serviceOrdersError } = await supabase
        .from('service_orders')
        .select('id', { count: 'exact' })
        .eq('device_id', deviceId);

      if (serviceOrdersError) throw serviceOrdersError;

      if (serviceOrdersCount > 0) {
        showError("Não é possível deletar este dispositivo. Ele está associado a ordens de serviço.");
        return;
      }

      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', deviceId)
        .eq('user_id', user?.id); // Ensure only user's own devices can be deleted

      if (error) throw error;

      setDevices(prev => prev.filter(device => device.id !== deviceId));
      showSuccess("Dispositivo deletado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao deletar dispositivo:", error);
      showError(`Erro ao deletar dispositivo: ${error.message || "Tente novamente."}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <CardTitle className="text-2xl flex items-center gap-2"><Smartphone className="h-6 w-6 text-primary" /> Dispositivos</CardTitle>
        <Button asChild className="w-full md:w-auto">
          <Link to="/new-device">
            <Plus className="h-4 w-4 mr-2" /> Novo Dispositivo
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por marca, modelo, série ou cliente..."
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
          <Select value={customerFilter} onValueChange={setCustomerFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filtrar por Cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Clientes</SelectItem>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <p className="text-center text-gray-600 dark:text-gray-400">Carregando dispositivos...</p>
        ) : !user ? (
          <p className="text-center text-red-500">Você precisa estar logado para ver os dispositivos.</p>
        ) : devices.length === 0 ? (
          <p className="text-center text-gray-600 dark:text-gray-400">Nenhum dispositivo encontrado com os filtros aplicados.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Marca</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Nº de Série</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell className="font-medium">{device.brand}</TableCell>
                    <TableCell>{device.model}</TableCell>
                    <TableCell>{device.serial_number || 'N/A'}</TableCell>
                    <TableCell>{device.customers?.name || 'N/A'}</TableCell>
                    <TableCell>{format(new Date(device.created_at), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                    <TableCell className="text-right flex justify-end space-x-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/devices/${device.id}`}>
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
                              Esta ação não pode ser desfeita. Isso excluirá permanentemente este dispositivo.
                              Se o dispositivo estiver associado a ordens de serviço, a exclusão não será permitida.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteDevice(device.id)} disabled={isDeleting}>
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