import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2, Loader2, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// ... (interface remains the same)
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

  // ... (fetch and delete logic remains the same)
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
      await supabase.from('service_orders').delete().eq('id', serviceOrder.id);
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
    // ... (status badge logic remains the same)
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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/service-orders')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <CardTitle className="text-3xl">Ordem de Serviço</CardTitle>
            <CardDescription>ID: {serviceOrder.id.substring(0, 8)}...</CardDescription>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/service-orders/${serviceOrder.id}/print`} target="_blank">
              <Printer className="h-4 w-4 mr-2" /> Imprimir
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/service-orders/${serviceOrder.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" /> Editar
            </Link>
          </Button>
          {/* ... (Delete button remains the same) ... */}
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {/* ... (Rest of the component remains the same) ... */}
      </CardContent>
    </Card>
  );
}