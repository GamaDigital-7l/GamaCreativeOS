import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Loader2, Package, Tag, Hash, DollarSign, Factory, FileText, Image as ImageIcon } from 'lucide-react'; // Adicionado ImageIcon
import { Badge } from '@/components/ui/badge'; // Import Badge

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
  category?: string; // Nova coluna
  image_url?: string; // Nova coluna
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
        <p className="ml-2 text-gray-600 dark:text-gray-400">Carregando detalhes do item...</p>
      </div>
    );
  }

  if (!item) {
    return <p className="text-center text-red-500">Item não encontrado.</p>;
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-4">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/inventory')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <CardTitle className="text-3xl flex items-center gap-2"><Package className="h-7 w-7 text-primary" /> {item.name}</CardTitle>
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
        {item.image_url && (
          <div className="flex justify-center mb-4">
            <img src={item.image_url} alt={item.name} className="max-h-64 object-contain rounded-md border" />
          </div>
        )}
        <div className="flex items-start gap-2">
          <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
          <p><strong>Descrição:</strong> {item.description || 'N/A'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-muted-foreground" />
          <p><strong>Categoria:</strong> {item.category ? <Badge variant="secondary">{item.category}</Badge> : 'N/A'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Hash className="h-5 w-5 text-muted-foreground" />
          <p><strong>Quantidade em Estoque:</strong> {item.quantity}</p>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-muted-foreground" />
          <p><strong>Custo (R$):</strong> {item.cost_price.toFixed(2)}</p>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-muted-foreground" />
          <p><strong>Preço de Venda (R$):</strong> {item.selling_price.toFixed(2)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Factory className="h-5 w-5 text-muted-foreground" />
          <p><strong>Fornecedor:</strong> {item.supplier || 'N/A'}</p>
        </div>
      </CardContent>
    </Card>
  );
}