import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2, Loader2, Building, User, Phone, Mail, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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

interface SupplierDetails {
  id: string;
  created_at: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export function SupplierDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading: isSessionLoading } = useSession();
  const [supplier, setSupplier] = useState<SupplierDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isSessionLoading && user && id) {
      fetchSupplierDetails(id);
    } else if (!isSessionLoading && !user) {
      navigate('/login');
    } else if (!id) {
      showError("ID do Fornecedor não fornecido.");
      navigate('/suppliers');
    }
  }, [id, user, isSessionLoading, navigate]);

  const fetchSupplierDetails = async (supplierId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select(`id, created_at, name, contact_person, phone, email, address`)
        .eq('id', supplierId)
        .eq('user_id', user?.id) // Ensure user can only see their own suppliers
        .single();

      if (error) throw error;
      if (!data) {
        showError("Fornecedor não encontrado.");
        navigate('/suppliers');
        return;
      }
      setSupplier(data as SupplierDetails);
    } catch (error: any) {
      console.error("Erro ao buscar detalhes do fornecedor:", error);
      showError(`Erro ao carregar detalhes: ${error.message || "Tente novamente."}`);
      navigate('/suppliers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSupplier = async () => {
    if (!supplier || !user) {
      showError("Não foi possível deletar o fornecedor. Tente novamente.");
      return;
    }

    setIsDeleting(true);
    try {
      // Check if supplier is linked to any sales
      const { count: salesCount, error: salesError } = await supabase
        .from('sales')
        .select('id', { count: 'exact' })
        .eq('supplier_id', supplier.id);

      if (salesError) throw salesError;

      if (salesCount > 0) {
        showError("Não é possível deletar este fornecedor. Ele está associado a vendas.");
        return;
      }

      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', supplier.id)
        .eq('user_id', user.id); // Ensure only user's own suppliers can be deleted

      if (error) throw error;

      showSuccess("Fornecedor deletado com sucesso!");
      navigate('/suppliers');
    } catch (error: any) {
      console.error("Erro ao deletar fornecedor:", error);
      showError(`Erro ao deletar fornecedor: ${error.message || "Tente novamente."}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-gray-600 dark:text-gray-400">Carregando detalhes do fornecedor...</p>
      </div>
    );
  }

  if (!supplier) {
    return <p className="text-center text-red-500">Fornecedor não encontrado ou você não tem permissão para visualizá-lo.</p>;
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-4">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/suppliers')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <CardTitle className="text-3xl flex items-center gap-2"><Building className="h-7 w-7 text-primary" /> {supplier.name}</CardTitle>
            <CardDescription>Criado em: {format(new Date(supplier.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</CardDescription>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/suppliers/${supplier.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" /> Editar
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isDeleting}>
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Deletar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza que deseja deletar?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente este fornecedor.
                  Se o fornecedor estiver associado a vendas, a exclusão não será permitida.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteSupplier} disabled={isDeleting}>
                  {isDeleting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Deletar"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-muted-foreground" />
          <p><strong>Pessoa de Contato:</strong> {supplier.contact_person || 'N/A'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-muted-foreground" />
          <p><strong>Telefone:</strong> {supplier.phone || 'N/A'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <p><strong>Email:</strong> {supplier.email || 'N/A'}</p>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-muted-foreground" />
          <p><strong>Endereço:</strong> {supplier.address || 'N/A'}</p>
        </div>
      </CardContent>
    </Card>
  );
}