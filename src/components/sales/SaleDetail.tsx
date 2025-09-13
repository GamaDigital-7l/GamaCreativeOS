import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2, Loader2, Printer, Smartphone, User, Package, DollarSign, CalendarDays, CreditCard, Factory, FileText, RefreshCcw } from 'lucide-react'; // Added RefreshCcw icon
import { format, addDays, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';

interface TradeInDetails {
  brand: string;
  model: string;
  imei_serial: string;
  value: number;
  condition?: string;
}

interface SaleDetails {
  id: string;
  created_at: string;
  device_brand: string;
  device_model: string;
  imei_serial: string;
  condition?: string;
  notes?: string;
  supplier_id?: string;
  purchase_date?: string;
  acquisition_cost?: number;
  customer_id?: string;
  sale_price: number;
  payment_method?: string;
  warranty_days?: number;
  warranty_policy?: string;
  trade_in_details?: TradeInDetails; // New field
  customers: { name: string } | null;
  suppliers: { name: string } | null;
}

export function SaleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSession();
  const [sale, setSale] = useState<SaleDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user && id) {
      fetchSaleDetails(id);
    }
  }, [id, user]);

  const fetchSaleDetails = async (saleId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`*, customers(name), suppliers(name)`)
        .eq('id', saleId)
        .single();
      if (error) throw error;
      setSale(data as SaleDetails);
    } catch (error: any) {
      showError(`Erro ao carregar detalhes: ${error.message}`);
      navigate('/sales');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('sales').delete().eq('id', id);
      if (error) throw error;
      showSuccess("Venda deletada com sucesso!");
      navigate('/sales');
    } catch (error: any) {
      showError(`Erro ao deletar: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  if (!sale) {
    return <p className="text-center text-red-500">Venda não encontrada.</p>;
  }

  const profit = sale.sale_price - (sale.acquisition_cost || 0) + (sale.trade_in_details?.value || 0); // Include trade-in value in profit calculation

  const getWarrantyInfo = () => {
    if (!sale.warranty_days || sale.warranty_days === 0) {
      return { status: <Badge variant="secondary">Sem Garantia</Badge>, endDate: 'N/A', daysRemaining: 'N/A' };
    }

    const saleDate = new Date(sale.created_at);
    const warrantyEndDate = addDays(saleDate, sale.warranty_days);
    const daysRemaining = differenceInDays(warrantyEndDate, new Date());

    let statusBadge;
    if (daysRemaining <= 0) {
      statusBadge = <Badge variant="destructive">Garantia Expirada</Badge>;
    } else if (daysRemaining <= 30) {
      statusBadge = <Badge variant="warning" className="bg-yellow-600 text-white">Expira em {daysRemaining} dias</Badge>;
    } else {
      statusBadge = <Badge variant="success">Ativa</Badge>;
    }

    return {
      status: statusBadge,
      endDate: format(warrantyEndDate, 'dd/MM/yyyy', { locale: ptBR }),
      daysRemaining: daysRemaining > 0 ? `${daysRemaining} dias` : 'Expirada',
    };
  };

  const warrantyInfo = getWarrantyInfo();

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Button variant="ghost" size="icon" className="-ml-2" onClick={() => navigate('/sales')}><ArrowLeft className="h-5 w-5" /></Button>
              <CardTitle className="text-2xl flex items-center gap-2"><Smartphone className="h-6 w-6 text-primary" /> {sale.device_brand} {sale.device_model}</CardTitle>
            </div>
            <CardDescription>Venda registrada em: {format(new Date(sale.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/sales/${sale.id}/print`} target="_blank">
                <Printer className="h-4 w-4 mr-2" /> Imprimir Recibo
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild><Link to={`/sales/${sale.id}/edit`}><Edit className="h-4 w-4 mr-2" /> Editar</Link></Button>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="h-4 w-4 mr-2" /> Deletar</Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Tem certeza?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>{isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Deletar"}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold text-lg border-b pb-2 flex items-center gap-2"><Smartphone className="h-5 w-5 text-primary" /> Detalhes do Aparelho</h3>
            <p className="flex items-center gap-2"><strong>IMEI/Serial:</strong> {sale.imei_serial}</p>
            <p className="flex items-center gap-2"><strong>Condição:</strong> {sale.condition || 'N/A'}</p>
            <p className="flex items-start gap-2"><strong>Observações:</strong> {sale.notes || 'N/A'}</p>
          </div>
          <div className="space-y-4 p-4 border rounded-lg bg-muted/40">
            <h3 className="font-semibold text-lg border-b pb-2 flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary" /> Financeiro</h3>
            <p className="flex items-center gap-2"><strong>Custo:</strong> R$ {(sale.acquisition_cost || 0).toFixed(2)}</p>
            {sale.trade_in_details && (
              <p className="flex items-center gap-2 text-orange-500"><strong>Entrada:</strong> R$ {sale.trade_in_details.value.toFixed(2)}</p>
            )}
            <p className="flex items-center gap-2"><strong>Venda:</strong> R$ {sale.sale_price.toFixed(2)}</p>
            <p className={`font-bold text-lg pt-2 border-t ${profit >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center gap-2`}>
              Lucro: R$ {profit.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold text-lg border-b pb-2 flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> Dados da Compra</h3>
            <p className="flex items-center gap-2"><strong>Fornecedor:</strong> {sale.suppliers?.name || 'N/A'}</p>
            <p className="flex items-center gap-2"><strong>Data da Compra:</strong> {sale.purchase_date ? format(new Date(sale.purchase_date), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}</p>
          </div>
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold text-lg border-b pb-2 flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Dados da Venda</h3>
            <p className="flex items-center gap-2"><strong>Cliente:</strong> {sale.customers?.name || 'N/A'}</p>
            <p className="flex items-center gap-2"><strong>Pagamento:</strong> {sale.payment_method || 'N/A'}</p>
          </div>
        </div>
        {sale.trade_in_details && (
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold text-lg border-b pb-2 flex items-center gap-2"><RefreshCcw className="h-5 w-5 text-primary" /> Detalhes do Aparelho de Entrada</h3>
            <p className="flex items-center gap-2"><strong>Marca/Modelo:</strong> {sale.trade_in_details.brand} {sale.trade_in_details.model}</p>
            <p className="flex items-center gap-2"><strong>IMEI/Serial:</strong> {sale.trade_in_details.imei_serial}</p>
            <p className="flex items-center gap-2"><strong>Valor:</strong> R$ {sale.trade_in_details.value.toFixed(2)}</p>
            <p className="flex items-center gap-2"><strong>Condição:</strong> {sale.trade_in_details.condition || 'N/A'}</p>
          </div>
        )}
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="font-semibold text-lg border-b pb-2 flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" /> Informações de Garantia</h3>
          <p className="flex items-center gap-2"><strong>Status:</strong> {warrantyInfo.status}</p>
          <p className="flex items-center gap-2"><strong>Prazo:</strong> {sale.warranty_days ? `${sale.warranty_days} dias` : 'N/A'}</p>
          <p className="flex items-center gap-2"><strong>Válida até:</strong> {warrantyInfo.endDate}</p>
          <p className="flex items-start gap-2"><strong>Política:</strong> {sale.warranty_policy || 'N/A'}</p>
        </div>
      </CardContent>
    </Card>
  );
}