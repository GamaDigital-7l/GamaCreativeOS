import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2, Loader2, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

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

  const profit = sale.sale_price - (sale.acquisition_cost || 0);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Button variant="ghost" size="icon" className="-ml-2" onClick={() => navigate('/sales')}><ArrowLeft className="h-5 w-5" /></Button>
              <CardTitle className="text-2xl">{sale.device_brand} {sale.device_model}</CardTitle>
            </div>
            <CardDescription>Venda registrada em: {format(new Date(sale.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
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
            <h3 className="font-semibold text-lg border-b pb-2">Detalhes do Aparelho</h3>
            <p><strong>IMEI/Serial:</strong> {sale.imei_serial}</p>
            <p><strong>Condição:</strong> {sale.condition || 'N/A'}</p>
            <p><strong>Observações:</strong> {sale.notes || 'N/A'}</p>
          </div>
          <div className="space-y-4 p-4 border rounded-lg bg-muted/40">
            <h3 className="font-semibold text-lg border-b pb-2">Financeiro</h3>
            <p><strong>Custo:</strong> R$ {(sale.acquisition_cost || 0).toFixed(2)}</p>
            <p><strong>Venda:</strong> R$ {sale.sale_price.toFixed(2)}</p>
            <p className={`font-bold text-lg pt-2 border-t ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Lucro: R$ {profit.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold text-lg border-b pb-2">Dados da Compra</h3>
            <p><strong>Fornecedor:</strong> {sale.suppliers?.name || 'N/A'}</p>
            <p><strong>Data da Compra:</strong> {sale.purchase_date ? format(new Date(sale.purchase_date), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}</p>
          </div>
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold text-lg border-b pb-2">Dados da Venda</h3>
            <p><strong>Cliente:</strong> {sale.customers?.name || 'N/A'}</p>
            <p><strong>Pagamento:</strong> {sale.payment_method || 'N/A'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}