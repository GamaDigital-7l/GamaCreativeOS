import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Loader2 } from 'lucide-react';

interface ItemDetails {
  id: string;
  created_at: string;
  name: string;
  description?: string;
  sku?: string;
  quantity: number;
  cost_price: number;
  selling_price: number;
  supplier?: string;
}

export function InventoryItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading: isSessionLoading } = useSession();
  const [item, setItem] = useState<ItemDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSessionLoading && user && id) {
      fetchItemDetails(id);
    } else if (!isSessionLoading && !user) {
      navigate('/login');
    }
  }, [id, user, isSessionLoading, navigate]);

  const fetchItemDetails = async (itemId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select(`*`)
        .eq('id', itemId)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setItem(data as ItemDetails);
    } catch (error: any) {
      showError(`Erro ao carregar detalhes: ${error.message}`);
      navigate('/inventory');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!item) {
    return <p className="text-center text-red-500">Item não encontrado.</p>;
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/inventory')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <CardTitle className="text-3xl">{item.name}</CardTitle>
            <CardDescription>SKU: {item.sku || 'N/A'}</CardDescription>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/inventory/${item.id}/edit`}>
            <Edit className="h-4 w-4 mr-2" /> Editar
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <p><strong>Descrição:</strong> {item.description || 'N/A'}</p>
        <p><strong>Quantidade em Estoque:</strong> {item.quantity}</p>
        <p><strong>Custo (R$):</strong> {item.cost_price.toFixed(2)}</p>
        <p><strong>Preço de Venda (R$):</strong> {item.selling_price.toFixed(2)}</p>
        <p><strong>Fornecedor:</strong> {item.supplier || 'N/A'}</p>
      </CardContent>
    </Card>
  );
}