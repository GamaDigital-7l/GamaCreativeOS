import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Eye, Search, X, Plus, Loader2, Trash2, Package, Tag, Hash, DollarSign } from 'lucide-react'; // Adicionado Tag, Hash, DollarSign icons
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface InventoryItem {
  id: string;
  name: string;
  sku?: string;
  quantity: number;
  cost_price: number;
  selling_price: number;
}

export function InventoryList() {
  const { user, isLoading: isSessionLoading } = useSession();
  const navigate = useNavigate();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!isSessionLoading && user) {
      fetchItems();
    } else if (!isSessionLoading && !user) {
      setIsLoading(false);
      navigate('/login');
    }
  }, [user, isSessionLoading, searchTerm, navigate]);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('inventory_items')
        .select(`id, name, sku, quantity, cost_price, selling_price`)
        .eq('user_id', user?.id)
        .order('name', { ascending: true });

      if (searchTerm) {
        query = query.or(
          `name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      setItems(data as InventoryItem[]);
    } catch (error: any) {
      showError(`Erro ao carregar itens do estoque: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    setIsDeleting(itemId);
    try {
      // Note: In the future, we'll add a check here to prevent deleting items used in service orders.
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setItems(prev => prev.filter(item => item.id !== itemId));
      showSuccess("Item deletado com sucesso!");
    } catch (error: any) {
      showError(`Erro ao deletar item: ${error.message}`);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <CardTitle className="text-2xl flex items-center gap-2"><Package className="h-6 w-6 text-primary" /> Itens no Estoque</CardTitle>
        <Button asChild className="w-full md:w-auto">
          <Link to="/inventory/new">
            <Plus className="h-4 w-4 mr-2" /> Novo Item
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="relative flex-grow mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-8"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {isLoading ? (
          <p className="text-center text-gray-600">Carregando itens...</p>
        ) : items.length === 0 ? (
          <p className="text-center text-gray-600">Nenhum item encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Custo (R$)</TableHead>
                  <TableHead>Preço de Venda (R$)</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.sku || 'N/A'}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.cost_price.toFixed(2)}</TableCell>
                    <TableCell>{item.selling_price.toFixed(2)}</TableCell>
                    <TableCell className="text-right flex justify-end space-x-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/inventory/${item.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" disabled={!!isDeleting}>
                            {isDeleting === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita e excluirá permanentemente o item do estoque.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteItem(item.id)}>
                              Deletar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}