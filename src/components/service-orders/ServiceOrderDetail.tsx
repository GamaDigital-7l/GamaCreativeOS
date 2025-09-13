import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2, Loader2, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ServiceOrderDetails {
  id: string;
  created_at: string;
  updated_at: string;
  status: string;
  issue_description?: string;
  service_details?: string;
  parts_cost?: number;
  service_cost?: number;
  total_amount?: number;
  guarantee_terms?: string;
  photos?: string[];
  customers: { id: string; name: string; phone?: string; address?: string; email?: string; };
  devices: { id: string; brand: string; model: string; serial_number?: string; defect_description?: string; password_info?: string; checklist?: string[]; };
  service_order_inventory_items: {
    quantity_used: number;
    price_at_time: number;
    inventory_items: {
      name: string;
    } | null;
  }[];
}

export function ServiceOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading: isSessionLoading } = useSession();
  const [serviceOrder, setServiceOrder] = useState<ServiceOrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isSessionLoading && user && id) {
      fetchServiceOrderDetails(id);
    } else if (!isSessionLoading && !user) {
      navigate('/login');
    }
  }, [id, user, isSessionLoading, navigate]);

  const fetchServiceOrderDetails = async (orderId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_orders')
        .select(`
          *,
          customers (*),
          devices (*),
          service_order_inventory_items (
            quantity_used,
            price_at_time,
            inventory_items ( name )
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      setServiceOrder(data as ServiceOrderDetails);
    } catch (error: any) {
      showError(`Erro ao carregar detalhes: ${error.message}`);
      navigate('/service-orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteServiceOrder = async () => {
    // ... (delete logic remains the same)
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!serviceOrder) {
    return <p className="text-center text-red-500">Ordem de Serviço não encontrada.</p>;
  }

  const getStatusBadgeVariant = (status: string) => {
    // ... (status badge logic remains the same)
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        {/* ... Header remains the same ... */}
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {/* ... Customer, Device, Items, and Cost details remain the same ... */}

        {/* Photos Section */}
        {serviceOrder.photos && serviceOrder.photos.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold mb-2">Fotos do Aparelho</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {serviceOrder.photos.map((photoUrl, index) => (
                <a key={index} href={photoUrl} target="_blank" rel="noopener noreferrer">
                  <img
                    src={photoUrl}
                    alt={`Foto do aparelho ${index + 1}`}
                    className="rounded-lg object-cover w-full h-32 hover:opacity-80 transition-opacity"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ... Guarantee Terms section remains the same ... */}
      </CardContent>
    </Card>
  );
}