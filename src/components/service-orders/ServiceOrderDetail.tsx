import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2, Loader2, Printer, Share2, CheckCircle, XCircle, Clock, Ticket, DollarSign, FileText, List, PowerOff, ListChecks } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { QuoteShareDialog } from './QuoteShareDialog';
import { PaymentDialog } from './PaymentDialog';
import { cn } from '@/lib/utils'; // Import cn for conditional classes

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
  client_checklist?: Record<string, 'ok' | 'not_working'>;
  is_untestable?: boolean;
  casing_status?: 'good' | 'scratched' | 'damaged' | null; // New field
  customers: { id: string; name: string; phone?: string; address?: string; email?: string; };
  devices: { id: string; brand: string; model: string; serial_number?: string; defect_description?: string; password_info?: string; checklist?: Record<string, string>; };
  service_order_inventory_items: {
    quantity_used: number;
    price_at_time: number;
    inventory_items: {
      name: string;
    } | null;
  }[];
  service_order_field_values: {
    value: string;
    custom_field_id: string;
    service_order_custom_fields: {
      field_name: string;
      field_type: string;
      order_index: number;
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
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
        .select(`
          *, 
          customers (*), 
          devices (*), 
          service_order_inventory_items (*, inventory_items (name)),
          service_order_field_values (value, custom_field_id, service_order_custom_fields (field_name, field_type, order_index))
        `)
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
        return <Badge variant="success" className="gap-1"><CheckCircle className="h-3 w-3" /> Aprovado em {serviceOrder.approved_at ? format(new Date(serviceOrder.approved_at), 'dd/MM/yy') : 'N/A'}</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Recusado</Badge>;
      default:
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Aguardando Aprovação</Badge>;
    }
  };

  const handleFinalizePayment = async (paymentMethod: string) => {
    if (!user || !id || !serviceOrder) return;

    try {
      const { error: osError } = await supabase.from('service_orders').update({
        status: 'completed', payment_method: paymentMethod, payment_status: 'paid',
        finalized_at: new Date().toISOString(),
      }).eq('id', id);
      if (osError) throw osError;

      const description = `Recebimento OS #${id.substring(0, 8)} - Cliente: ${serviceOrder.customers.name}`;
      const { error: transactionError } = await supabase
        .from('financial_transactions')
        .insert({
          user_id: user.id,
          transaction_date: new Date().toISOString(),
          description: description,
          amount: serviceOrder.total_amount || 0,
          type: 'income',
          category: 'Recebimento de Serviço',
          related_service_order_id: id,
        });

      if (transactionError) {
        showError(`OS finalizada, mas falha ao registrar no financeiro: ${transactionError.message}`);
      } else {
        showSuccess("Pagamento registrado e OS concluída!");
      }
      
      setIsPaymentDialogOpen(false);
      fetchServiceOrderDetails(id); // Refresh data
    } catch (error: any) {
      showError(`Erro ao finalizar pagamento: ${error.message}`);
    }
  };

  const handleDeleteServiceOrder = async () => {
    if (!id || !user || !serviceOrder) return;
    setIsDeleting(true);
    try {
      // Revert inventory quantities first
      if (serviceOrder.service_order_inventory_items && serviceOrder.service_order_inventory_items.length > 0) {
        const stockRevertPromises = serviceOrder.service_order_inventory_items.map(item =>
          supabase.rpc('increment_quantity', { item_id: item.inventory_items?.id, amount: item.quantity_used })
        );
        await Promise.all(stockRevertPromises);
      }

      // Delete related financial transactions
      await supabase.from('financial_transactions').delete().eq('related_service_order_id', id).eq('user.id', user.id);

      // Delete service order custom field values
      await supabase.from('service_order_field_values').delete().eq('service_order_id', id);

      // Delete service order inventory items
      await supabase.from('service_order_inventory_items').delete().eq('service_order_id', id);

      // Finally, delete the service order
      const { error } = await supabase.from('service_orders').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;

      showSuccess("Ordem de Serviço deletada com sucesso!");
      navigate('/service-orders');
    } catch (error: any) {
      showError(`Erro ao deletar OS: ${error.message}`);
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

  const canFinalize = serviceOrder.status !== 'completed' && serviceOrder.status !== 'cancelled' && (serviceOrder.status === 'ready' || serviceOrder.approval_status === 'approved');

  // Group custom field values by field_name
  const groupedCustomFields = serviceOrder.service_order_field_values.reduce((acc, fieldValue) => {
    const fieldName = fieldValue.service_order_custom_fields?.field_name;
    if (fieldName) {
      if (!acc[fieldName]) {
        acc[fieldName] = [];
      }
      acc[fieldName].push(fieldValue.value);
    }
    return acc;
  }, {} as Record<string, string[]>);

  const getCasingStatusLabel = (status: 'good' | 'scratched' | 'damaged' | null | undefined) => {
    switch (status) {
      case 'good': return <Badge variant="success">Bom Estado</Badge>;
      case 'scratched': return <Badge variant="warning" className="bg-yellow-600 text-white">Arranhado</Badge>;
      case 'damaged': return <Badge variant="destructive">Amassado/Quebrado</Badge>;
      default: return <Badge variant="secondary">N/A</Badge>;
    }
  };

  return (
    <>
      <QuoteShareDialog isOpen={isShareDialogOpen} onClose={() => setIsShareDialogOpen(false)} serviceOrderId={serviceOrder.id} />
      <PaymentDialog isOpen={isPaymentDialogOpen} onClose={() => setIsPaymentDialogOpen(false)} onSubmit={handleFinalizePayment} totalAmount={serviceOrder.total_amount || 0} />

      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Button variant="ghost" size="icon" className="-ml-2" onClick={() => navigate('/service-orders')}><ArrowLeft className="h-5 w-5" /></Button>
                <CardTitle className="text-2xl">Detalhes da Ordem de Serviço</CardTitle>
              </div>
              <CardDescription>ID: {serviceOrder.id.substring(0, 8)}...</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 justify-end mt-2 sm:mt-0"> {/* Added flex-wrap and justify-end */}
              <Button variant="outline" size="sm" asChild><Link to={`/service-orders/${serviceOrder.id}/print`} target="_blank"><Printer className="h-4 w-4 mr-2" /> Imprimir OS</Link></Button>
              <Button variant="outline" size="sm" asChild><Link to={`/service-orders/${serviceOrder.id}/print-label`} target="_blank"><Ticket className="h-4 w-4 mr-2" /> Imprimir Etiqueta</Link></Button>
              {serviceOrder.status === 'completed' && (
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/service-orders/${serviceOrder.id}/print-warranty`} target="_blank">
                    <FileText className="h-4 w-4 mr-2" /> Imprimir Garantia
                  </Link>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setIsShareDialogOpen(true)}><Share2 className="h-4 w-4 mr-2" /> Compartilhar Orçamento</Button>
              <Button variant="outline" size="sm" asChild><Link to={`/service-orders/${serviceOrder.id}/edit`}><Edit className="h-4 w-4 mr-2" /> Editar</Link></Button>
              {canFinalize && (
                <Button variant="default" size="sm" onClick={() => setIsPaymentDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
                  <DollarSign className="h-4 w-4 mr-2" /> Finalizar OS
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={isDeleting}>
                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                    Deletar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza que deseja deletar?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Isso excluirá permanentemente esta Ordem de Serviço,
                      reverterá os itens de estoque utilizados e removerá os lançamentos financeiros associados.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteServiceOrder} disabled={isDeleting}>
                      {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Deletar"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="flex justify-between items-center p-3 bg-muted rounded-lg flex-wrap gap-2"> {/* Added flex-wrap and gap-2 */}
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
                {serviceOrder.approved_at && (
                  <p className="text-sm text-center text-muted-foreground mt-2">
                    Aprovado em: {format(new Date(serviceOrder.approved_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Customer Details */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Dados do Cliente</h3>
            <p><strong>Nome:</strong> {serviceOrder.customers.name}</p>
            <p><strong>Telefone:</strong> {serviceOrder.customers.phone || 'N/A'}</p>
            <p><strong>Email:</strong> {serviceOrder.customers.email || 'N/A'}</p>
            <p><strong>Endereço:</strong> {serviceOrder.customers.address || 'N/A'}</p>
          </div>

          {/* Device Details */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Dados do Aparelho</h3>
            <p><strong>Marca:</strong> {serviceOrder.devices.brand}</p>
            <p><strong>Modelo:</strong> {serviceOrder.devices.model}</p>
            <p><strong>Número de Série/IMEI:</strong> {serviceOrder.devices.serial_number || 'N/A'}</p>
            <p><strong>Defeito Relatado:</strong> {serviceOrder.devices.defect_description || 'N/A'}</p>
            <p><strong>Informações de Senha:</strong> {serviceOrder.devices.password_info || 'N/A'}</p>
            {serviceOrder.devices.checklist && Object.keys(serviceOrder.devices.checklist).length > 0 && (
              <div>
                <p className="font-semibold mt-2">Checklist de Entrada:</p>
                <ul className="list-disc list-inside ml-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4">
                  {Object.entries(serviceOrder.devices.checklist).map(([key, status], index) => (
                    <li key={index}>{key.replace(/_/g, ' ')}: {status}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Client Checklist Display */}
          {serviceOrder.is_untestable ? (
            <div className="p-3 bg-orange-100 text-orange-800 rounded-md flex items-center gap-2">
              <PowerOff className="h-5 w-5" />
              <p className="font-semibold">Aparelho entrou desligado / não testável. O checklist do cliente não foi preenchido.</p>
            </div>
          ) : (
            <>
              {serviceOrder.client_checklist && Object.keys(serviceOrder.client_checklist).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><ListChecks className="h-5 w-5" /> Checklist do Cliente</h3>
                  <ul className="list-disc list-inside ml-4 grid grid-cols-2 sm:grid-cols-3 gap-x-4">
                    {Object.entries(serviceOrder.client_checklist).map(([item, status], index) => (
                      <li key={index} className={cn("flex items-center gap-1", status === 'ok' ? 'text-green-600' : 'text-red-600')}>
                        {status === 'ok' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                        {item}: {status === 'ok' ? 'Funciona' : 'Não Funciona'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {serviceOrder.casing_status && (
                <div className="mt-4">
                  <p className="font-semibold mb-2 flex items-center gap-2"><ListChecks className="h-5 w-5" /> Carcaça:</p>
                  <p className="ml-4">{getCasingStatusLabel(serviceOrder.casing_status)}</p>
                </div>
              )}
            </>
          )}

          {/* Custom Fields Display */}
          {Object.keys(groupedCustomFields).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><List className="h-5 w-5" /> Campos Personalizados</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(groupedCustomFields).map(([fieldName, values]) => (
                  <div key={fieldName}>
                    <p><strong>{fieldName}:</strong> {values.join(', ')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Service Details */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Detalhes do Serviço</h3>
            <p><strong>Descrição do Serviço:</strong> {serviceOrder.service_details || 'N/A'}</p>
            {serviceOrder.service_order_inventory_items && serviceOrder.service_order_inventory_items.length > 0 && (
              <div className="mt-4 overflow-x-auto"> {/* Added overflow-x-auto */}
                <h4 className="font-semibold mb-2">Peças Utilizadas:</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                      <TableHead className="text-right">Preço Unitário</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {serviceOrder.service_order_inventory_items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.inventory_items?.name || 'Item Removido'}</TableCell>
                        <TableCell className="text-right">{item.quantity_used}</TableCell>
                        <TableCell className="text-right">R$ {item.price_at_time.toFixed(2)}</TableCell>
                        <TableCell className="text-right">R$ {(item.quantity_used * item.price_at_time).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Costs Summary */}
          <div className="border-t pt-4 space-y-2">
            <h3 className="text-lg font-semibold mb-2">Resumo de Custos</h3>
            <div className="flex justify-between">
              <span>Custo das Peças:</span>
              <span>R$ {(serviceOrder.parts_cost || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Custo do Serviço (Mão de Obra):</span>
              <span>R$ {(serviceOrder.service_cost || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-xl border-t pt-2">
              <span>Total:</span>
              <span>R$ {(serviceOrder.total_amount || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Guarantee Terms */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-2">Termos de Garantia</h3>
            <p className="text-sm text-gray-600">{serviceOrder.guarantee_terms || 'N/A'}</p>
          </div>

          {/* Photos */}
          {serviceOrder.photos && serviceOrder.photos.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-2">Fotos do Aparelho</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {serviceOrder.photos.map((photoUrl, index) => (
                  <a key={index} href={photoUrl} target="_blank" rel="noopener noreferrer">
                    <img src={photoUrl} alt={`Foto da OS ${serviceOrder.id} - ${index + 1}`} className="w-full h-32 object-cover rounded-md shadow-sm" />
                  </a>
                ))}
              </div>
            </div>
          )}
          
        </CardContent>
      </Card>
    </>
  );
}