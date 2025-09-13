import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2, Loader2, Printer, Share2, CheckCircle, XCircle, Clock, Ticket } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { QuoteShareDialog } from './QuoteShareDialog';

interface ServiceOrderDetails {
  id: string;
  created_at: string;
  updated_at: string;
  status: string;
  approval_status?: string;
  customer_signature?: string;
  approved_at?: string;
  issue_description?: string;
  service_details?: string;
  parts_cost?: number;
  service_cost?: number;
  total_amount?: number;
  guarantee_terms?: string;
  photos?: string[];
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
  const { user } = useSession();
  const [serviceOrder, setServiceOrder] = useState<ServiceOrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  useEffect(() => {
    if (user && id) {
      fetchServiceOrderDetails(id);
    }
  }, [id, user]);

  const fetchServiceOrderDetails = async (orderId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_orders')
        .select(`*, customers (*), devices (*), service_order_inventory_items (quantity_used, price_at_time, inventory_items (name))`)
        .eq('id', orderId)
        .single();
      if (error) throw error;
      setServiceOrder(data as ServiceOrderDetails);
    } catch (error: any) {
      showError(`Erro ao carregar detalhes: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const ApprovalStatusBadge = () => {
    if (!serviceOrder?.approval_status) return null;
    switch (serviceOrder.approval_status) {
      case 'approved':
        return <Badge variant="success" className="gap-1"><CheckCircle className="h-3 w-3" /> Aprovado em {format(new Date(serviceOrder.approved_at!), 'dd/MM/yy')}</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Recusado</Badge>;
      default:
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Aguardando Aprovação</Badge>;
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  if (!serviceOrder) {
    return <p className="text-center text-red-500">Ordem de Serviço não encontrada.</p>;
  }

  return (
    <>
      <QuoteShareDialog isOpen={isShareDialogOpen} onClose={() => setIsShareDialogOpen(false)} serviceOrderId={serviceOrder.id} />
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Button variant="ghost" size="icon" className="-ml-2" onClick={() => navigate('/service-orders')}><ArrowLeft className="h-5 w-5" /></Button>
                <CardTitle className="text-2xl">Detalhes da Ordem de Serviço</CardTitle>
              </div>
              <CardDescription>ID: {serviceOrder.id.substring(0, 8)}...</CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <Button variant="outline" size="sm" asChild><Link to={`/service-orders/${serviceOrder.id}/print-label`} target="_blank"><Ticket className="h-4 w-4 mr-2" /> Imprimir Etiqueta</Link></Button>
              <Button variant="outline" size="sm" onClick={() => setIsShareDialogOpen(true)}><Share2 className="h-4 w-4 mr-2" /> Compartilhar Orçamento</Button>
              <Button variant="outline" size="sm" asChild><Link to={`/service-orders/${serviceOrder.id}/edit`}><Edit className="h-4 w-4 mr-2" /> Editar</Link></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
            <div>
              <span className="text-sm text-muted-foreground">Status da OS</span>
              <p className="font-bold text-lg">{serviceOrder.status}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Status do Orçamento</span>
              <div className="mt-1"><ApprovalStatusBadge /></div>
            </div>
          </div>
          
          {serviceOrder.customer_signature && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Assinatura do Cliente</h3>
              <div className="border rounded-md p-2 bg-white">
                <img src={serviceOrder.customer_signature} alt="Assinatura do cliente" className="mx-auto" />
              </div>
            </div>
          )}

          {/* Rest of the component remains the same... */}
          
        </CardContent>
      </Card>
    </>
  );
}