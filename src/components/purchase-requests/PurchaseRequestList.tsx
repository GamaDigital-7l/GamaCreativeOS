import React, { useEffect, useState, useCallback } from 'react';
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
import { Button } from '@/components/ui/button';
import { Eye, Search, X, Plus, Loader2, Trash2, Edit, ClipboardList, Package, CalendarDays } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PurchaseRequestForm } from './PurchaseRequestForm';

interface PurchaseRequest {
  id: string;
  created_at: string;
  updated_at: string;
  requested_quantity: number;
  status: 'pending' | 'ordered' | 'received' | 'cancelled';
  notes?: string;
  inventory_items: {
    id: string;
    name: string;
    sku?: string;
    quantity: number; // Current stock
  } | null;
}

export function PurchaseRequestList() {
  const { user, isLoading: isSessionLoading } = useSession();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRequestId, setEditingRequestId] = useState<string | undefined>(undefined);

  const fetchPurchaseRequests = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      let query = supabase
        .from('purchase_requests')
        .select(`
          id,
          created_at,
          updated_at,
          requested_quantity,
          status,
          notes,
          inventory_items (id, name, sku, quantity)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(
          `inventory_items.name.ilike.%${searchTerm}%,inventory_items.sku.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      showError(`Erro ao carregar pedidos de compra: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [user, searchTerm]);

  useEffect(() => {
    if (!isSessionLoading && user) {
      fetchPurchaseRequests();
    } else if (!isSessionLoading && !user) {
      setIsLoading(false);
    }
  }, [user, isSessionLoading, fetchPurchaseRequests]);

  const handleNewRequest = () => {
    setEditingRequestId(undefined);
    setIsFormOpen(true);
  };

  const handleEditRequest = (requestId: string) => {
    setEditingRequestId(requestId);
    setIsFormOpen(true);
  };

  const handleDeleteRequest = async (requestId: string) => {
    setIsDeleting(requestId);
    try {
      const { error } = await supabase
        .from('purchase_requests')
        .delete()
        .eq('id', requestId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setRequests(prev => prev.filter(req => req.id !== requestId));
      showSuccess("Pedido de compra deletado com sucesso!");
    } catch (error: any) {
      showError(`Erro ao deletar pedido: ${error.message}`);
    } finally {
      setIsDeleting(null);
    }
  };

  const getStatusBadgeVariant = (status: PurchaseRequest['status']) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'ordered': return 'default';
      case 'received': return 'success';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <CardTitle className="text-2xl flex items-center gap-2"><ClipboardList className="h-6 w-6 text-primary" /> Pedidos de Compra</CardTitle>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto" onClick={handleNewRequest}>
              <Plus className="h-4 w-4 mr-2" /> Novo Pedido
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingRequestId ? "Editar Pedido de Compra" : "Novo Pedido de Compra"}</DialogTitle>
            </DialogHeader>
            <PurchaseRequestForm
              requestId={editingRequestId}
              onSuccess={() => {
                setIsFormOpen(false);
                fetchPurchaseRequests();
              }}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="relative flex-grow mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por item, SKU ou notas..."
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
          <p className="text-center text-gray-600">Carregando pedidos...</p>
        ) : requests.length === 0 ? (
          <p className="text-center text-gray-600">Nenhum pedido de compra encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Qtd. Solicitada</TableHead>
                  <TableHead>Estoque Atual</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Última Atualização</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      {request.inventory_items?.name || 'Item Removido'}
                      {request.inventory_items?.sku && <span className="text-xs text-muted-foreground">({request.inventory_items.sku})</span>}
                    </TableCell>
                    <TableCell>{request.requested_quantity}</TableCell>
                    <TableCell>{request.inventory_items?.quantity ?? 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(request.status)}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(request.updated_at), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                    <TableCell className="text-right flex justify-end space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditRequest(request.id)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" disabled={isDeleting === request.id}>
                            {isDeleting === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita e excluirá permanentemente este pedido de compra.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteRequest(request.id)}>
                              Deletar
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