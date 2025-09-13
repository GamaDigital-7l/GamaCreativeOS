import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/integrations/supabase/SessionContext";
import { showSuccess, showError } from "@/utils/toast";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Loader2, CalendarIcon, Save, Smartphone, ShoppingCart, Package, User, Tag, Hash, DollarSign, Factory, CreditCard, FileText, RefreshCcw } from "lucide-react"; // Added RefreshCcw icon
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CustomerSearchSelect } from "@/components/shared/CustomerSearchSelect";

const warrantyTemplates = {
  "30": "Garantia de 30 dias para o aparelho, cobrindo defeitos de fabricação. Não cobre danos por mau uso, quedas ou contato com líquidos.",
  "90": "Garantia de 90 dias para o aparelho, cobrindo defeitos de fabricação. Não cobre danos por mau uso, quedas ou contato com líquidos.",
  "180": "Garantia de 180 dias para o aparelho, cobrindo defeitos de fabricação. Não cobre danos por mau uso, quedas ou contato com líquidos.",
  "0": "Produto vendido sem garantia.",
};

const formSchema = z.object({
  // Device
  device_brand: z.string().min(2, "Marca é obrigatória."),
  device_model: z.string().min(2, "Modelo é obrigatório."),
  imei_serial: z.string().min(10, "IMEI/Serial é obrigatório."),
  condition: z.string().optional(),
  notes: z.string().optional(),
  
  // Purchase
  supplier_id: z.string().uuid().optional().nullable(),
  purchase_date: z.date().optional().nullable(),
  acquisition_cost: z.preprocess(val => Number(String(val || '0').replace(",", ".")), z.number().min(0)),

  // Sale
  customer_id: z.string().uuid().optional().nullable(),
  sale_price: z.preprocess(val => Number(String(val).replace(",", ".")), z.number().positive("Preço de venda é obrigatório.")),
  payment_method: z.string().optional(),
  warranty_days: z.preprocess(val => Number(val || 0), z.number().int().min(0).optional()),
  warranty_policy: z.string().optional(),

  // Trade-in (new fields)
  has_trade_in: z.boolean().default(false),
  trade_in_device_brand: z.string().optional(),
  trade_in_device_model: z.string().optional(),
  trade_in_imei_serial: z.string().optional(),
  trade_in_value: z.preprocess(val => Number(String(val || '0').replace(",", ".")), z.number().min(0)).optional(),
  trade_in_condition: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.has_trade_in) {
    if (!data.trade_in_device_brand || data.trade_in_device_brand.length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Marca do aparelho de entrada é obrigatória.", path: ["trade_in_device_brand"] });
    }
    if (!data.trade_in_device_model || data.trade_in_device_model.length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Modelo do aparelho de entrada é obrigatório.", path: ["trade_in_device_model"] });
    }
    if (!data.trade_in_imei_serial || data.trade_in_imei_serial.length < 10) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "IMEI/Serial do aparelho de entrada é obrigatório.", path: ["trade_in_imei_serial"] });
    }
    if (data.trade_in_value === undefined || data.trade_in_value < 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Valor do aparelho de entrada é obrigatório e deve ser positivo.", path: ["trade_in_value"] });
    }
  }
});

interface Supplier { id: string; name: string; }

export function NewSaleForm() {
  const { user } = useSession();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      device_brand: "", device_model: "", imei_serial: "",
      acquisition_cost: 0, sale_price: 0,
      supplier_id: null, customer_id: null, purchase_date: null,
      warranty_days: 90,
      warranty_policy: warrantyTemplates["90"],
      has_trade_in: false, // Default to no trade-in
      trade_in_device_brand: "",
      trade_in_device_model: "",
      trade_in_imei_serial: "",
      trade_in_value: 0,
      trade_in_condition: "",
    },
  });

  const hasTradeIn = form.watch("has_trade_in");

  useEffect(() => {
    if (!user) return;
    supabase.from('suppliers').select('id, name').eq('user_id', user.id).then(({ data }) => setSuppliers(data || []));
  }, [user]);

  const handleWarrantyDaysChange = (days: string) => {
    const numDays = parseInt(days);
    form.setValue("warranty_days", numDays);
    form.setValue("warranty_policy", warrantyTemplates[days as keyof typeof warrantyTemplates]);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;
    setIsSubmitting(true);

    let tradeInDetails = null;
    if (values.has_trade_in) {
      tradeInDetails = {
        brand: values.trade_in_device_brand,
        model: values.trade_in_device_model,
        imei_serial: values.trade_in_imei_serial,
        value: values.trade_in_value,
        condition: values.trade_in_condition,
      };
    }

    try {
      const { error } = await supabase.from('sales').insert({
        ...values,
        user_id: user.id,
        purchase_date: values.purchase_date ? format(values.purchase_date, 'yyyy-MM-dd') : null,
        trade_in_details: tradeInDetails, // Store as JSONB
      });
      if (error) throw error;
      showSuccess("Venda registrada com sucesso!");
      navigate('/sales');
    } catch (error: any) {
      showError(`Erro ao registrar venda: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Tabs defaultValue="device" className="w-full">
          <TabsList className="grid w-full grid-cols-4"> {/* Increased grid columns */}
            <TabsTrigger value="device" className="flex items-center gap-2"><Smartphone className="h-4 w-4" /> Aparelho</TabsTrigger>
            <TabsTrigger value="purchase" className="flex items-center gap-2"><Package className="h-4 w-4" /> Compra</TabsTrigger>
            <TabsTrigger value="sale" className="flex items-center gap-2"><ShoppingCart className="h-4 w-4" /> Venda</TabsTrigger>
            <TabsTrigger value="trade-in" className="flex items-center gap-2"><RefreshCcw className="h-4 w-4" /> Entrada</TabsTrigger> {/* New Tab */}
          </TabsList>
          
          <TabsContent value="device" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Smartphone className="h-5 w-5 text-primary" /> Dados do Aparelho</CardTitle><CardDescription>Detalhes do dispositivo que está sendo vendido.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <FormField name="device_brand" control={form.control} render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Tag className="h-4 w-4" /> Marca</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="device_model" control={form.control} render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Smartphone className="h-4 w-4" /> Modelo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="imei_serial" control={form.control} render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Hash className="h-4 w-4" /> IMEI / Nº de Série</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="condition" control={form.control} render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><FileText className="h-4 w-4" /> Condição</FormLabel><FormControl><Input placeholder="Ex: Novo, Usado, Vitrine" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="purchase" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> Dados da Compra</CardTitle><CardDescription>Como e por quanto este aparelho foi adquirido.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <FormField name="supplier_id" control={form.control} render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Factory className="h-4 w-4" /> Fornecedor</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}><FormControl><SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger></FormControl><SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField name="acquisition_cost" control={form.control} render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Custo de Aquisição (R$)</FormLabel><FormControl><Input type="text" inputMode="decimal" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="purchase_date" control={form.control} render={({ field }) => (<FormItem className="flex flex-col"><FormLabel className="flex items-center gap-2"><CalendarIcon className="h-4 w-4" /> Data da Compra</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sale" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-primary" /> Dados da Venda</CardTitle><CardDescription>Para quem e por quanto o aparelho foi vendido.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <FormField name="customer_id" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><User className="h-4 w-4" /> Cliente</FormLabel>
                    <FormControl>
                      <CustomerSearchSelect
                        value={field.value || undefined}
                        onValueChange={field.onChange}
                        placeholder="Buscar ou selecionar cliente (opcional)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="sale_price" control={form.control} render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Preço de Venda (R$)</FormLabel><FormControl><Input type="text" inputMode="decimal" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="payment_method" control={form.control} render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Forma de Pagamento</FormLabel><FormControl><Input placeholder="Ex: PIX, Cartão 3x" {...field} /></FormControl><FormMessage /></FormItem>)} />
                
                <FormField name="warranty_days" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><CalendarIcon className="h-4 w-4" /> Prazo de Garantia</FormLabel>
                    <Select onValueChange={handleWarrantyDaysChange} value={String(field.value)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o prazo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="30">30 Dias</SelectItem>
                        <SelectItem value="90">90 Dias</SelectItem>
                        <SelectItem value="180">180 Dias</SelectItem>
                        <SelectItem value="0">Sem Garantia</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="warranty_policy" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><FileText className="h-4 w-4" /> Termos de Garantia</FormLabel>
                    <FormControl><Textarea placeholder="Termos de garantia específicos..." className="min-h-[100px]" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="notes" control={form.control} render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><FileText className="h-4 w-4" /> Observações</FormLabel><FormControl><Textarea placeholder="Detalhes adicionais sobre a venda..." {...field} /></FormControl><FormMessage /></FormItem>)} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* New Trade-in Tab */}
          <TabsContent value="trade-in" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><RefreshCcw className="h-5 w-5 text-primary" /> Aparelho de Entrada</CardTitle>
                <CardDescription>Detalhes de um aparelho que o cliente deu como parte do pagamento.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="has_trade_in"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          O cliente deu um aparelho de entrada?
                        </FormLabel>
                        <FormDescription>
                          Marque esta opção se houver um aparelho sendo entregue como parte do pagamento.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                {hasTradeIn && (
                  <>
                    <FormField name="trade_in_device_brand" control={form.control} render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Tag className="h-4 w-4" /> Marca do Aparelho de Entrada</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField name="trade_in_device_model" control={form.control} render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Smartphone className="h-4 w-4" /> Modelo do Aparelho de Entrada</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField name="trade_in_imei_serial" control={form.control} render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Hash className="h-4 w-4" /> IMEI / Nº de Série do Aparelho de Entrada</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField name="trade_in_value" control={form.control} render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Valor de Entrada (R$)</FormLabel><FormControl><Input type="text" inputMode="decimal" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField name="trade_in_condition" control={form.control} render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><FileText className="h-4 w-4" /> Condição do Aparelho de Entrada</FormLabel><FormControl><Input placeholder="Ex: Usado, Com defeito, Vitrine" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <div className="flex justify-end mt-6">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : <><Save className="h-4 w-4 mr-2" /> Salvar Venda</>}
          </Button>
        </div>
      </form>
    </Form>
  );
}