import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Receipt, User, DollarSign, CalendarDays, CreditCard, Package, Printer } from 'lucide-react'; // Added Printer icon
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface POSSaleDetails {
  id: string;
  created_at: string;
  total_amount: number;
  payment_method?: string;
  customers: { name: string; phone?: string; email?: string; } | null;
  pos_sale_items: {
    quantity: number;
    price_at_time: number;
    inventory_item_id: string;
    inventory_items: {
      name: string;
      sku?: string;
    } | null;
  }[];
}

export function POSSaleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSession();
  const [sale, setSale] = useState<POSSaleDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;

    const fetchSaleDetails = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('pos_sales')
          .select(`
            *,
            customers(name, phone, email),
            pos_sale_items(
              quantity,
              price_at_time,
              inventory_item_id,
              inventory_items(name, sku)
            )
          `)
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        if (!data) {
          showError("Venda PDV não encontrada.");
          navigate('/pos/history');
          return;
        }
        setSale(data as POSSaleDetails);
      } catch (error: any) {
        console.error("Erro ao buscar detalhes da venda PDV:", error);
        showError(`Erro ao carregar detalhes: ${error.message || "Tente novamente."}`);
        navigate('/pos/history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSaleDetails();
  }, [id, user, navigate]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-gray-600 dark:text-gray-400">Carregando detalhes da venda PDV...</p>
      </div>
    );
  }

  if (!sale) {
    return <p className="text-center text-red-500">Venda PDV não encontrada ou você não tem permissão para visualizá-la.</p>;
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-4">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/pos/history')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <CardTitle className="text-3xl flex items-center gap-2"><Receipt className="h-7 w-7 text-primary" /> Venda PDV #{sale.id.substring(0, 8)}</CardTitle>
            <CardDescription>Registrada em: {format(new Date(sale.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</CardDescription>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/pos-sales/${sale.id}/print-options`}> {/* New print button */}
            <Printer className="h-4 w-4 mr-2" /> Imprimir Recibo
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {/* Customer Details */}
        <div>
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Dados do Cliente</h3>
          <p><strong>Nome:</strong> {sale.customers?.name || 'N/A'}</p>
          <p><strong>Telefone:</strong> {sale.customers?.phone || 'N/A'}</p>
          <p><strong>Email:</strong> {sale.customers?.email || 'N/A'}</p>
        </div>

        {/* Items Sold */}
        <div>
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> Itens Vendidos</h3>
          {sale.pos_sale_items && sale.pos_sale_items.length > 0 ? (
            <div className="overflow-x-auto"> {/* Ensure table is scrollable on mobile */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Qtd.</TableHead>
                    <TableHead className="text-right">Preço Unit.</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sale.pos_sale_items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.inventory_items?.name || 'Item Removido'}</TableCell>
                      <TableCell>{item.inventory_items?.sku || 'N/A'}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">R$ {item.price_at_time.toFixed(2)}</TableCell>
                      <TableCell className="text-right">R$ {(item.quantity * item.price_at_time).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhum item registrado para esta venda.</p>
          )}
        </div>

        {/* Payment Summary */}
        <div className="border-t pt-4 space-y-2">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary" /> Resumo do Pagamento</h3>
          <div className="flex justify-between">
            <span>Método de Pagamento:</span>
            <span>{sale.payment_method || 'N/A'}</span>
          </div>
          <div className="flex justify-between font-bold text-xl border-t pt-2">
            <span>Total da Venda:</span>
            <span>R$ {sale.total_amount.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}