import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Package, Tag, DollarSign, Factory, FileText, Image as ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"; // Import Carousel components

interface InventoryItemDetails {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  selling_price: number;
  category?: string;
  supplier?: string;
  image_urls?: string[];
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<InventoryItemDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("ID do produto não fornecido.");
      setIsLoading(false);
      return;
    }
    fetchProductDetails(id);
  }, [id]);

  const fetchProductDetails = async (itemId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select(`id, name, description, sku, selling_price, category, supplier, image_urls`)
        .eq('id', itemId)
        .gt('quantity', 0) // Only show if in stock
        .single();

      if (error) throw error;
      if (!data) {
        setError("Produto não encontrado ou fora de estoque.");
        return;
      }
      setItem(data as InventoryItemDetails);
    } catch (err: any) {
      console.error("Error fetching product details:", err);
      setError("Não foi possível carregar os detalhes do produto.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (error || !item) {
    return <div className="flex h-screen items-center justify-center text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-primary/10 p-4 sm:p-8 flex flex-col items-center">
      <Card className="w-full max-w-4xl mx-auto bg-card text-card-foreground shadow-lg">
        <CardHeader className="pb-4 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="icon" className="-ml-2" onClick={() => navigate('/catalog')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <CardTitle className="text-3xl font-bold text-primary">{item.name}</CardTitle>
          </div>
          <CardDescription>Detalhes do produto em nosso catálogo.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {item.image_urls && item.image_urls.length > 0 ? (
            <Carousel className="w-full max-w-xl mx-auto">
              <CarouselContent>
                {item.image_urls.map((url, index) => (
                  <CarouselItem key={index}>
                    <div className="p-1">
                      <Card className="border-none">
                        <CardContent className="flex aspect-video items-center justify-center p-0">
                          <img src={url} alt={`${item.name} - ${index + 1}`} className="w-full h-full object-contain rounded-md" />
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          ) : (
            <div className="w-full h-64 bg-muted flex items-center justify-center rounded-md">
              <ImageIcon className="h-24 w-24 text-muted-foreground" />
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-primary" />
              <p className="text-3xl font-bold text-primary">R$ {item.selling_price.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-muted-foreground" />
              <p><strong>Categoria:</strong> {item.category ? <Badge variant="secondary">{item.category}</Badge> : 'N/A'}</p>
            </div>
            {item.sku && (
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-muted-foreground" />
                <p><strong>SKU:</strong> {item.sku}</p>
              </div>
            )}
            {item.supplier && (
              <div className="flex items-center gap-2">
                <Factory className="h-5 w-5 text-muted-foreground" />
                <p><strong>Fornecedor:</strong> {item.supplier}</p>
              </div>
            )}
            <div className="flex items-start gap-2">
              <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
              <p><strong>Descrição:</strong> {item.description || 'Nenhuma descrição detalhada disponível.'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}