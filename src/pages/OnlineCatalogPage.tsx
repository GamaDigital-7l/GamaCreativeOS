import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Share2, Copy, CheckCircle, XCircle, Package, Tag, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MadeWithDyad } from '@/components/made-with-dyad';

interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  selling_price: number;
  category?: string;
  image_url?: string;
}

export default function OnlineCatalogPage() {
  const { itemIds: paramItemIds } = useParams<{ itemIds?: string }>();
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [currentCategoryFilter, setCurrentCategoryFilter] = useState(categoryFilter || 'all');

  useEffect(() => {
    fetchCatalogItems();
  }, [paramItemIds, currentCategoryFilter]);

  const fetchCatalogItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('inventory_items')
        .select('id, name, description, selling_price, category, image_url')
        .gt('quantity', 0); // Only show items in stock

      if (paramItemIds) {
        const idsArray = paramItemIds.split(',');
        query = query.in('id', idsArray);
      } else if (currentCategoryFilter !== 'all') {
        query = query.eq('category', currentCategoryFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setItems(data || []);
      if (paramItemIds) {
        setSelectedItems(paramItemIds.split(','));
      }
    } catch (err: any) {
      console.error("Error fetching catalog items:", err);
      setError("Não foi possível carregar os itens do catálogo.");
    } finally {
      setIsLoading(false);
    }
  };

  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    items.forEach(item => {
      if (item.category) categories.add(item.category);
    });
    return ['all', ...Array.from(categories).sort()];
  }, [items]);

  const handleSelectItem = (itemId: string, isChecked: boolean) => {
    setSelectedItems(prev =>
      isChecked ? [...prev, itemId] : prev.filter(id => id !== itemId)
    );
  };

  const generateShareLink = (itemIdsToShare: string[] | 'all' | 'category') => {
    let link = `${window.location.origin}/catalog`;
    if (itemIdsToShare === 'all') {
      // No specific params needed for all items
    } else if (itemIdsToShare === 'category' && currentCategoryFilter !== 'all') {
      link += `?category=${currentCategoryFilter}`;
    } else if (Array.isArray(itemIdsToShare) && itemIdsToShare.length > 0) {
      link += `/${itemIdsToShare.join(',')}`;
    }
    setShareLink(link);
    setIsShareDialogOpen(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    showSuccess("Link copiado para a área de transferência!");
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (error) {
    return <div className="flex h-screen items-center justify-center text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 flex flex-col items-center">
      <Card className="w-full max-w-4xl mb-6">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Catálogo Online</CardTitle>
          <CardDescription>Explore nossos produtos disponíveis.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <Select value={currentCategoryFilter} onValueChange={(value) => {
              setCurrentCategoryFilter(value);
              // Update URL search params to reflect category filter
              const newSearchParams = new URLSearchParams(searchParams);
              if (value === 'all') {
                newSearchParams.delete('category');
              } else {
                newSearchParams.set('category', value);
              }
              window.history.replaceState(null, '', `?${newSearchParams.toString()}`);
            }}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar por Categoria" />
              </SelectTrigger>
              <SelectContent>
                {uniqueCategories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'Todas as Categorias' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button onClick={() => generateShareLink(selectedItems)} disabled={selectedItems.length === 0} className="w-full sm:w-auto">
                <Share2 className="h-4 w-4 mr-2" /> Compartilhar Selecionados
              </Button>
              <Button variant="outline" onClick={() => generateShareLink('all')} className="w-full sm:w-auto">
                <Share2 className="h-4 w-4 mr-2" /> Compartilhar Catálogo Completo
              </Button>
            </div>
          </div>

          {items.length === 0 ? (
            <p className="text-center text-muted-foreground">Nenhum produto encontrado nesta categoria.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map(item => (
                <Card key={item.id} className="relative overflow-hidden">
                  <div className="absolute top-2 right-2 z-10">
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                    />
                  </div>
                  <CardContent className="p-0">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-48 object-cover rounded-t-lg" />
                    ) : (
                      <div className="w-full h-48 bg-muted flex items-center justify-center rounded-t-lg">
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="p-4 space-y-2">
                      <h3 className="text-xl font-semibold">{item.name}</h3>
                      {item.category && <Badge variant="secondary" className="mb-2">{item.category}</Badge>}
                      <p className="text-muted-foreground text-sm line-clamp-2">{item.description || 'Sem descrição.'}</p>
                      <p className="text-2xl font-bold text-primary">R$ {item.selling_price.toFixed(2)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <MadeWithDyad />

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Compartilhar Catálogo</DialogTitle>
            <DialogDescription>Copie o link abaixo para compartilhar com seus clientes.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="share-link" className="sr-only">Link</Label>
              <Input id="share-link" defaultValue={shareLink} readOnly />
            </div>
            <Button type="button" size="sm" className="px-3" onClick={handleCopyLink}>
              <span className="sr-only">Copiar</span>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button type="button" variant="secondary" onClick={() => setIsShareDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}