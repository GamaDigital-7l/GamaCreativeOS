import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Image as ImageIcon, Eye } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { GamaLogo } from '@/components/GamaLogo'; // Updated import

interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  selling_price: number;
  category?: string;
  image_urls?: string[];
}

export default function PublicCatalogPage() {
  const { itemIds: paramItemIds } = useParams<{ itemIds?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const categoryFilter = searchParams.get('category');

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCatalogItems();
  }, [paramItemIds, categoryFilter]);

  const fetchCatalogItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('inventory_items')
        .select('id, name, description, selling_price, category, image_urls')
        .gt('quantity', 0); // Only show items in stock

      if (paramItemIds) {
        const idsArray = paramItemIds.split(',');
        query = query.in('id', idsArray);
      } else if (categoryFilter) {
        query = query.eq('category', categoryFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setItems(data || []);
    } catch (err: any) {
      console.error("Error fetching public catalog items:", err);
      setError("Não foi possível carregar os itens do catálogo.");
    } finally {
      setIsLoading(false);
    }
  };

  const title = useMemo(() => {
    if (paramItemIds) return "Produtos Selecionados";
    if (categoryFilter) return `Catálogo: ${categoryFilter}`;
    return "Nosso Catálogo de Produtos";
  }, [paramItemIds, categoryFilter]);

  const description = useMemo(() => {
    if (paramItemIds) return "Confira os produtos que selecionamos para você.";
    if (categoryFilter) return `Explore os produtos da categoria "${categoryFilter}".`;
    return "Descubra a variedade de produtos que oferecemos.";
  }, [paramItemIds, categoryFilter]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (error) {
    return <div className="flex h-screen items-center justify-center text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-primary/10 p-4 sm:p-8 flex flex-col items-center">
      <Card className="w-full max-w-5xl mb-6 bg-card text-card-foreground shadow-lg">
        <CardHeader className="text-center pb-4 border-b border-border">
          <CardTitle className="text-4xl font-extrabold text-primary mb-2">{title}</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground text-lg py-10">Nenhum produto encontrado.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map(item => (
                <Card key={item.id} className="relative overflow-hidden group cursor-pointer hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="p-0" onClick={() => navigate(`/catalog/item/${item.id}`)}>
                    {item.image_urls && item.image_urls.length > 0 ? (
                      <img src={item.image_urls[0]} alt={item.name} className="w-full h-48 object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-48 bg-muted flex items-center justify-center rounded-t-lg">
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="p-4 space-y-2">
                      <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors duration-300">{item.name}</h3>
                      {item.category && <Badge variant="secondary" className="mb-2">{item.category}</Badge>}
                      <p className="text-muted-foreground text-sm line-clamp-2">{item.description || 'Sem descrição detalhada.'}</p>
                      <div className="flex items-center justify-between pt-2">
                        <p className="text-2xl font-bold text-primary">R$ {item.selling_price.toFixed(2)}</p>
                        <Eye className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <GamaLogo /> {/* Using the new GamaLogo component */}
    </div>
  );
}