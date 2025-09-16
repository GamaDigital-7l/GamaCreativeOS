import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'; // Adicionado useNavigate
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Share2, Copy, Package, Tag, Image as ImageIcon, Eye } from 'lucide-react'; // Adicionado Eye icon
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { GamaCreative } from '@/components/gama-creative';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  selling_price: number;
  category?: string;
  image_urls?: string[];
}

export default function OnlineCatalogPage() {
  const { itemIds: paramItemIds } = useParams<{ itemIds?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate(); // Inicializa useNavigate
  const categoryFilter = searchParams.get('category');

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [currentCategoryFilter, setCurrentCategoryFilter] = useState(categoryFilter || 'all');
  const [shareOption, setShareOption] = useState<'selected' | 'category' | 'all'>('selected');

  useEffect(() => {
    fetchCatalogItems();
  }, [paramItemIds, currentCategoryFilter]);

  const fetchCatalogItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('inventory_items')
        .select('id, name, description, selling_price, category, image_urls')
        .gt('quantity', 0);

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

  const generateAndOpenShareDialog = () => {
    let link = `${window.location.origin}/public-catalog`; // Aponta para a nova página pública
    if (shareOption === 'selected' && selectedItems.length > 0) {
      link += `/${selectedItems.join(',')}`;
    } else if (shareOption === 'category' && currentCategoryFilter !== 'all') {
      link += `?category=${currentCategoryFilter}`;
    } else if (shareOption === 'all') {
      // No specific params needed for all items, base link is enough
    }
    console.log("Generated share link:", link); // Debug log
    setShareLink(link);
    setIsShareDialogOpen(true);
  };

  const handleCopyLink = () => {
    console.log("Copying link:", shareLink); // Debug log
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
    <div className="min-h-screen bg-gradient-to-br from-background to-primary/10 p-4 sm:p-8 flex flex-col items-center">
      <Card className="w-full max-w-5xl mb-6 bg-card text-card-foreground shadow-lg">
        <CardHeader className="text-center pb-4 border-b border-border">
          <CardTitle className="text-4xl font-extrabold text-primary mb-2">Nosso Catálogo</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Descubra a variedade de produtos e serviços que oferecemos.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <Select value={currentCategoryFilter} onValueChange={(value) => {
              setCurrentCategoryFilter(value);
              const newSearchParams = new URLSearchParams(searchParams);
              if (value === 'all') {
                newSearchParams.delete('category');
              } else {
                newSearchParams.set('category', value);
              }
              navigate({ search: newSearchParams.toString() }); // Usar navigate para atualizar a URL
            }}>
              <SelectTrigger className="w-full sm:w-[250px] h-10 text-base">
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
            <Button onClick={generateAndOpenShareDialog} className="w-full sm:w-auto px-6 py-2 text-base">
              <Share2 className="h-4 w-4 mr-2" /> Compartilhar Catálogo
            </Button>
          </div>

          {items.length === 0 ? (
            <p className="text-center text-muted-foreground text-lg py-10">Nenhum produto encontrado nesta categoria.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map(item => (
                <Card key={item.id} className="relative overflow-hidden group cursor-pointer hover:shadow-xl transition-shadow duration-300">
                  <div className="absolute top-3 right-3 z-10">
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                      className="w-5 h-5"
                    />
                  </div>
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
                        <Button variant="ghost" size="icon" className="group-hover:opacity-100 opacity-0 transition-opacity duration-300">
                          <Eye className="h-5 w-5 text-primary" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <GamaCreative />
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Compartilhar Catálogo</DialogTitle>
            <DialogDescription>Selecione o que deseja compartilhar e copie o link.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <RadioGroup value={shareOption} onValueChange={(value: 'selected' | 'category' | 'all') => setShareOption(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="selected" id="share-selected" disabled={selectedItems.length === 0} />
                <Label htmlFor="share-selected">Itens Selecionados ({selectedItems.length})</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="category" id="share-category" disabled={currentCategoryFilter === 'all'} />
                <Label htmlFor="share-category">Categoria Atual ({currentCategoryFilter !== 'all' ? currentCategoryFilter : 'N/A'})</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="share-all" />
                <Label htmlFor="share-all">Catálogo Completo</Label>
              </div>
            </RadioGroup>
            <div className="flex items-center space-x-2">
              <div className="grid flex-1 gap-2">
                <Label htmlFor="share-link" className="sr-only">Link</Label>
                <Input id="share-link" defaultValue={shareLink} readOnly />
              </div>
              <Button type="button" size="sm" className="px-3" onClick={handleCopyLink}>
                <span className="sr-only">Copiar</span>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
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