"use client";

import React, { useEffect, useState, useCallback } from 'react';
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
import { CustomBadge as Badge } from "@/components/shared/CustomBadge";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Eye, Search, X, PlusCircle, Wrench, User, Smartphone, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ServiceOrder {
  id: string;
  created_at: string;
  status: string;
  issue_description: string;
  customers: Array<{
    name: string;
    phone?: string;
  }> | null;
  devices: Array<{
    brand: string;
    model: string;
  }> | null;
}

const serviceOrderStatuses = [
  { value: 'all', label: 'Todos os Status' },
  { value: 'orcamento', label: 'Orçamento', variant: 'secondary' },
  { value: 'aguardando_pecas', label: 'Aguardando Peças', variant: 'warning' },
  { value: 'em_manutencao', label: 'Em Manutenção', variant: 'default' },
  { value: 'pronto_para_retirada', label: 'Pronto para Retirada', variant: 'success' },
  { value: 'finalizado', label: 'Finalizado', variant: 'outline' },
  { value: 'nao_teve_reparo', label: 'Não Teve Reparo', variant: 'destructive' },
  { value: 'cancelado_pelo_cliente', label: 'Cancelado pelo Cliente', variant: 'destructive' },
];

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export const ServiceOrderList = React.memo(function ServiceOrderList() {
  const { user, isLoading: isSessionLoading } = useSession();
  const navigate = useNavigate();
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [hasMore, setHasMore] = useState(true);

  const fetchServiceOrders = useCallback(async () => {
    if (!user) return;
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
        `, { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (debouncedSearchTerm) {
        query = query.or(
          `customers.name.ilike.%${debouncedSearchTerm}%,devices.brand.ilike.%${debouncedSearchTerm}%,devices.model.ilike.%${debouncedSearchTerm}%`
        );
      }

      const { data, error, count } = await query;

      if (error) throw error;

      setServiceOrders(data as ServiceOrder[] || []);
      setHasMore((page + 1) * pageSize < (count || 0));
    } catch (error: any) {
      console.error("Erro ao buscar Ordens de Serviço:", error);
      showError(`Erro ao carregar Ordens de Serviço: ${error.message || "Tente novamente."}`);
    } finally {
      setIsLoading(false);
    }
  }, [user, debouncedSearchTerm, statusFilter, page, pageSize]);

  useEffect(() => {
    if (!isSessionLoading && user) {
      fetchServiceOrders();
    } else if (!isSessionLoading && !user) {
      setIsLoading(false);
    }
  }, [user, isSessionLoading, fetchServiceOrders]);

  const getStatusBadgeVariant = (status: string): "default" | "destructive" | "outline" | "secondary" | "warning" | "success" => {
    return (serviceOrderStatuses.find(s => s.value === status)?.variant || 'secondary') as "default" | "destructive" | "outline" | "secondary" | "warning" | "success";
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 sm:p-6">
        <CardTitle className="text-xl sm:text-2xl flex items-center gap-2"><Wrench className="h-5 w-5 sm:h-6 sm:w-6 text-primary" /> Ordens de Serviço</CardTitle>
        <Button asChild className="w-full sm:w-auto">
          <Link to="/new-service-order">
            <PlusCircle className="h-4 w-4 mr-2" /> Nova Ordem de Serviço
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, marca ou modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-8 w-full"
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
          <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(0); }}>
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
          <>
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
                      <TableCell className="flex items-center gap-1"><User className="h-4 w-4 text-muted-foreground" />{order.customers?.[0]?.name || 'N/A'}</TableCell>
                      <TableCell className="flex items-center gap-1"><Smartphone className="h-4 w-4 text-muted-foreground" />{order.devices?.[0]?.brand} {order.devices?.[0]?.model}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(order.status)}>
                          {serviceOrderStatuses.find(s => s.value === order.status)?.label || order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{order.issue_description}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/service-orders/${order.id}`} onClick={(e) => e.stopPropagation()}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-center space-x-4 mt-6">
              <Button onClick={() => setPage(prev => Math.max(0, prev - 1))} disabled={page === 0 || isLoading}>
                <ChevronLeft className="h-4 w-4 mr-2" /> Anterior
              </Button>
              <Button onClick={() => setPage(prev => prev + 1)} disabled={!hasMore || isLoading}>
                Próxima <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
});