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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
  customers: { id: string; name: string; phone?: string; address?: string; email?: string; };
  devices: { id: string; brand: string; model: string; serial_number?: string; defect_description?: string; password_info?: string; checklist?: string[]; };
  service_order_inventory_items: {
    quantity_used: number;
    price_at_time: number;
    inventory_items: {
      name: string;
    } | null;
  }[];
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
    }
  }, [id, user, isSessionLoading, navigate]);

  const fetchServiceOrderDetails = async (orderId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_orders')
        .select(`
          *,
          customers (*),
          devices (*),
          service_order_inventory_items (
            quantity_used,
            price_at_time,
            inventory_items ( name )
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      setServiceOrder(data as ServiceOrderDetails);
    } catch (error: any) {
      showError(`Erro ao carregar detalhes: ${error.message}`);
      navigate('/service-orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteServiceOrder = async () => {
    if (!serviceOrder || !user) return;
    setIsDeleting(true);
    try {
      // Deleting the service order will cascade delete related items in service_order_inventory_items
      await supabase.from('service_orders').delete().eq('id', serviceOrder.id);
      // Note: This logic does not automatically delete the customer or device.
      // That would require more complex checks to see if they are linked to other orders.
      showSuccess("Ordem de Serviço deletada com sucesso!");
      navigate('/service-orders');
    } catch (error: any) {
      showError(`Erro ao deletar: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!serviceOrder) {
    return <p className="text-center text-red-500">Ordem de Serviço não encontrada.</p>;
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'in_progress': return 'default';
      case 'ready': return 'success';
      case 'completed': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        {/* ... Header remains the same ... */}
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {/* Customer and Device Details remain the same */}
        
        {/* Service Items Details */}
        {serviceOrder.service_order_inventory_items.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold mb-2">Peças e Materiais</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead className="text-right">Preço Unit.</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceOrder.service_order_inventory_items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.inventory_items?.name || 'Item Removido'}</TableCell>
                    <TableCell>{item.quantity_used}</TableCell>
                    <TableCell className="text-right">R$ {item.price_at_time.toFixed(2)}</TableCell>
                    <TableCell className="text-right">R$ {(item.price_at_time * item.quantity_used).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Service Order Details */}
        <div>
          <h3 className="text-xl font-semibold mb-2">Detalhes e Custos do Serviço</h3>
          {/* ... other details ... */}
          <p><strong>Custo de Peças:</strong> R$ {(serviceOrder.parts_cost || 0).toFixed(2)}</p>
          <p><strong>Custo do Serviço:</strong> R$ {(serviceOrder.service_cost || 0).toFixed(2)}</p>
          <p className="font-bold text-lg"><strong>Valor Total:</strong> R$ {(serviceOrder.total_amount || 0).toFixed(2)}</p>
          {/* ... other details ... */}
        </div>
      </CardContent>
    </Card>
  );
}