import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError } from '@/utils/toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Eye, Search, X, PlusCircle, Wrench, User, Smartphone, Clock, CheckCircle, Ban } from 'lucide-react'; // Adicionado User, Smartphone, Clock, CheckCircle, Ban icons
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ServiceOrder {
  id: string;
  created_at: string;
  status: string;
  issue_description: string;
  customers: {
    name: string;
    phone?: string;
  };
  devices: {
    brand: string;
    model: string;
  };
}

const serviceOrderStatuses = [
  { value: 'all', label: 'Todos os Status' },
  { value: 'pending', label: 'Pendente' },
  { value: 'in_progress', label: 'Em Progresso' },
  { value: 'ready', label: 'Pronto' },
  { value: 'completed', label: 'Concluído' },
  { value: 'cancelled', label: 'Cancelado' },
];

export function ServiceOrderList() {
  const { user, isLoading: isSessionLoading } = useSession();
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!isSessionLoading && user) {
      fetchServiceOrders();
    } else if (!isSessionLoading && !user) {
      setIsLoading(false);
    }
  }, [user, isSessionLoading, searchTerm, statusFilter]); // Re-fetch when filters change

  const fetchServiceOrders = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('service_orders')
        .select(`
          id,
          created_at,
          status,
          issue_description,
          customers (name, phone),
          devices (brand, model)
        `)
        .eq('user_id', user?.id) // Filter by current user's ID
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (searchTerm) {
        // Perform a case-insensitive search across customer name, device brand, and device model
        query = query.or(
          `customers.name.ilike.%${searchTerm}%,devices.brand.ilike.%${searchTerm}%,devices.model.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      setServiceOrders(data as ServiceOrder[]);
    } catch (error: any) {
      console.error("Erro ao buscar Ordens de Serviço:", error);
      showError(`Erro ao carregar Ordens de Serviço: ${error.message || "Tente novamente."}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'in_progress':
        return 'default';
      case 'ready':
        return 'success'; // Assuming a 'success' variant exists or can be styled
      case 'completed':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <CardTitle className="text-2xl flex items-center gap-2"><Wrench className="h-6 w-6 text-primary" /> Ordens de Serviço</CardTitle>
        <Button asChild className="w-full md:w-auto">
          <Link to="/new-service-order">
            <PlusCircle className="h-4 w-4 mr-2" /> Nova Ordem de Serviço
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, marca ou modelo..."
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filtrar por Status" />
            </SelectTrigger>
            <SelectContent>
              {serviceOrderStatuses.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <p className="text-center text-gray-600 dark:text-gray-400">Carregando Ordens de Serviço...</p>
        ) : !user ? (
          <p className="text-center text-red-500">Você precisa estar logado para ver as Ordens de Serviço.</p>
        ) : serviceOrders.length === 0 ? (
          <p className="text-center text-gray-600 dark:text-gray-400">Nenhuma Ordem de Serviço encontrada com os filtros aplicados.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Aparelho</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Descrição do Problema</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceOrders.map((order) => (
                  <TableRow key={order.id} className="cursor-pointer" onClick={() => navigate(`/service-orders/${order.id}`)}>
                    <TableCell className="font-medium">{order.id.substring(0, 8)}...</TableCell>
                    <TableCell>{format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</TableCell>
                    <TableCell className="flex items-center gap-1"><User className="h-4 w-4 text-muted-foreground" />{order.customers?.name || 'N/A'}</TableCell>
                    <TableCell className="flex items-center gap-1"><Smartphone className="h-4 w-4 text-muted-foreground" />{order.devices?.brand} {order.devices?.model}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(order.status)}>
                        {serviceOrderStatuses.find(s => s.value === order.status)?.label || order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{order.issue_description}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/service-orders/${order.id}`} onClick={(e) => e.stopPropagation()}> {/* Prevent double navigation */}
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
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