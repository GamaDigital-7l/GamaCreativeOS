import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, X, Plus, Minus, ShoppingCart, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  selling_price: number;
}

interface CartItem extends InventoryItem {
  cartQuantity: number;
}

export function PointOfSale() {
  const { user } = useSession();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('pix');

  useEffect(() => {
    if (user) fetchInventory();
  }, [user]);

  const fetchInventory = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('inventory_items')
      .select('id, name, quantity, selling_price')
      .gt('quantity', 0); // Only fetch items in stock
    if (error) showError("Erro ao carregar estoque.");
    else setInventory(data || []);
    setIsLoading(false);
  };

  const filteredInventory = useMemo(() => {
    if (!searchTerm) return [];
    return inventory.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !cart.some(cartItem => cartItem.id === item.id) // Don't show items already in cart
    );
  }, [searchTerm, inventory, cart]);

  const addToCart = (item: InventoryItem) => {
    setCart(prev => [...prev, { ...item, cartQuantity: 1 }]);
    setSearchTerm('');
  };

  const updateCartQuantity = (itemId: string, amount: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQuantity = item.cartQuantity + amount;
        if (newQuantity > 0 && newQuantity <= item.quantity) {
          return { ...item, cartQuantity: newQuantity };
        }
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.selling_price * item.cartQuantity), 0);
  }, [cart]);

  const handleFinalizeSale = async () => {
    if (cart.length === 0 || !user) return;
    setIsSubmitting(true);
    try {
      // 1. Create the sale record
      const { data: saleData, error: saleError } = await supabase
        .from('pos_sales')
        .insert({
          user_id: user.id,
          total_amount: total,
          payment_method: paymentMethod,
        })
        .select()
        .single();
      if (saleError) throw saleError;

      // 2. Create sale item records
      const saleItems = cart.map(item => ({
        pos_sale_id: saleData.id,
        inventory_item_id: item.id,
        quantity: item.cartQuantity,
        price_at_time: item.selling_price,
      }));
      const { error: itemsError } = await supabase.from('pos_sale_items').insert(saleItems);
      if (itemsError) throw itemsError;

      // 3. Update inventory quantities
      const stockUpdates = cart.map(item =>
        supabase
          .from('inventory_items')
          .update({ quantity: item.quantity - item.cartQuantity })
          .eq('id', item.id)
      );
      await Promise.all(stockUpdates);

      showSuccess("Venda finalizada com sucesso!");
      setCart([]);
      fetchInventory(); // Refresh inventory
    } catch (error: any) {
      showError(`Erro ao finalizar venda: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Ponto de Venda (PDV)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar peça ou acessório..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {filteredInventory.length > 0 && (
                <div className="absolute z-10 w-full bg-background border rounded-md mt-1 max-h-60 overflow-y-auto">
                  {filteredInventory.map(item => (
                    <div key={item.id} onClick={() => addToCart(item)} className="p-2 hover:bg-accent cursor-pointer">
                      {item.name} <span className="text-sm text-muted-foreground">(Qtd: {item.quantity}) - R$ {item.selling_price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><ShoppingCart className="mr-2 h-5 w-5" /> Carrinho</CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <p className="text-center text-muted-foreground">Nenhum item no carrinho.</p>
            ) : (
              <>
                <div className="space-y-2">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">R$ {item.selling_price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="outline" onClick={() => updateCartQuantity(item.id, -1)}><Minus className="h-4 w-4" /></Button>
                        <span>{item.cartQuantity}</span>
                        <Button size="icon" variant="outline" onClick={() => updateCartQuantity(item.id, 1)}><Plus className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="text-red-500" onClick={() => removeFromCart(item.id)}><X className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>R$ {total.toFixed(2)}</span>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full mt-4" disabled={cart.length === 0}>Finalizar Venda</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Confirmar Pagamento</DialogTitle>
                      </DialogHeader>
                      <div className="py-4 space-y-4">
                        <div className="text-2xl font-bold text-center">Total: R$ {total.toFixed(2)}</div>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                          <SelectTrigger><SelectValue placeholder="Forma de Pagamento" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pix">PIX</SelectItem>
                            <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                            <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                            <SelectItem value="dinheiro">Dinheiro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <DialogFooter>
                        <Button variant="outline">Cancelar</Button>
                        <Button onClick={handleFinalizeSale} disabled={isSubmitting}>
                          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Confirmar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}