import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, X, Plus, Minus, ShoppingCart, Loader2, DollarSign, User, CreditCard } from 'lucide-react'; // Adicionado CreditCard icon
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label'; // Import Label

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  selling_price: number;
}

interface CartItem extends InventoryItem {
  cartQuantity: number;
}

interface CustomerOption {
  id: string;
  name: string;
}

export function PointOfSale() {
  const { user } = useSession();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(undefined);
  const [isFinalizeDialogOpen, setIsFinalizeDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchInventory();
      fetchCustomers();
    }
  }, [user]);

  const fetchInventory = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('inventory_items')
      .select('id, name, quantity, selling_price')
      .gt('quantity', 0)
      .eq('user_id', user?.id); // Filter by user_id
    if (error) showError("Erro ao carregar estoque.");
    else setInventory(data || []);
    setIsLoading(false);
  };

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('id, name')
      .eq('user_id', user?.id) // Filter by user_id
      .order('name', { ascending: true });
    if (error) showError("Erro ao carregar clientes.");
    else setCustomers(data || []);
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
    if (!selectedCustomerId) {
      showError("Por favor, selecione um cliente para finalizar a venda.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create the sale record
      const { data: saleData, error: saleError } = await supabase
        .from('pos_sales')
        .insert({
          user_id: user.id,
          customer_id: selectedCustomerId, // Include customer_id
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
          .eq('user_id', user.id) // Ensure user can only update their own inventory
      );
      await Promise.all(stockUpdates);

      // 4. Create financial transaction record
      const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
      const transactionDescription = `Venda PDV #${saleData.id.substring(0, 8)} - Cliente: ${selectedCustomer?.name || 'N/A'}`;
      const { error: transactionError } = await supabase
        .from('financial_transactions')
        .insert({
          user_id: user.id,
          transaction_date: new Date().toISOString(),
          description: transactionDescription,
          amount: total,
          type: 'income',
          category: 'Venda PDV',
          related_pos_sale_id: saleData.id,
        });
      if (transactionError) {
        showError(`Venda finalizada, mas falha ao registrar no financeiro: ${transactionError.message}`);
      } else {
        showSuccess("Venda finalizada e registrada no financeiro com sucesso!");
      }
      
      setCart([]);
      setSelectedCustomerId(undefined); // Clear selected customer
      setIsFinalizeDialogOpen(false);
      fetchInventory(); // Refresh inventory
    } catch (error: any) {
      showError(`Erro ao finalizar venda: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5 text-primary" /> Buscar Itens</CardTitle>
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
                <div className="absolute z-10 w-full bg-background border rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                  {filteredInventory.map(item => (
                    <div key={item.id} onClick={() => addToCart(item)} className="p-3 hover:bg-accent cursor-pointer flex justify-between items-center">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">Em estoque: {item.quantity}</p>
                      </div>
                      <span className="font-semibold text-primary">R$ {item.selling_price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {isLoading ? (
              <div className="flex justify-center items-center h-24 mt-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="mt-4 text-muted-foreground text-sm">
                {inventory.length === 0 && <p className="text-center">Nenhum item disponível no estoque.</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><ShoppingCart className="mr-2 h-5 w-5 text-primary" /> Carrinho</CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <p className="text-center text-muted-foreground">Nenhum item no carrinho.</p>
            ) : (
              <>
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">R$ {item.selling_price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="outline" onClick={() => updateCartQuantity(item.id, -1)} disabled={item.cartQuantity <= 1}><Minus className="h-4 w-4" /></Button>
                        <span className="font-semibold w-6 text-center">{item.cartQuantity}</span>
                        <Button size="icon" variant="outline" onClick={() => updateCartQuantity(item.id, 1)} disabled={item.cartQuantity >= item.quantity}><Plus className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-500/20" onClick={() => removeFromCart(item.id)}><X className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-border">
                  <div className="flex justify-between font-bold text-xl mb-4">
                    <span>Total:</span>
                    <span>R$ {total.toFixed(2)}</span>
                  </div>
                  <Dialog open={isFinalizeDialogOpen} onOpenChange={setIsFinalizeDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full" disabled={cart.length === 0}>Finalizar Venda</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary" /> Confirmar Pagamento</DialogTitle>
                      </DialogHeader>
                      <div className="py-4 space-y-4">
                        <div className="text-3xl font-bold text-center text-primary">Total: R$ {total.toFixed(2)}</div>
                        
                        <div>
                          <Label htmlFor="customer-select" className="flex items-center gap-2 mb-2"><User className="h-4 w-4" /> Cliente <span className="text-red-500">*</span></Label> {/* Added mandatory indicator */}
                          <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                            <SelectTrigger id="customer-select">
                              <SelectValue placeholder="Selecione um cliente" />
                            </SelectTrigger>
                            <SelectContent>
                              {customers.length === 0 ? (
                                <SelectItem value="no-customers" disabled>Nenhum cliente cadastrado</SelectItem>
                              ) : (
                                customers.map(customer => (
                                  <SelectItem key={customer.id} value={customer.id}>
                                    {customer.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="payment-method-select" className="flex items-center gap-2 mb-2"><CreditCard className="h-4 w-4" /> Forma de Pagamento</Label>
                          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger id="payment-method-select"><SelectValue placeholder="Forma de Pagamento" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pix">PIX</SelectItem>
                              <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                              <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                              <SelectItem value="dinheiro">Dinheiro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsFinalizeDialogOpen(false)} disabled={isSubmitting}>Cancelar</Button>
                        <Button onClick={handleFinalizeSale} disabled={isSubmitting || !selectedCustomerId}>
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