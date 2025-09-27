import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Plus, Search, Building, Eye, Trash2, Loader2, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
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

interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

export function SupplierList() {
  const { user } = useSession();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [isDeleting, setIsDeleting] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (user) fetchSuppliers();
  }, [user, debouncedSearchTerm, page, pageSize]);

  const fetchSuppliers = async () => {
    setIsLoading(true);
    let query = supabase.from('suppliers').select('*', { count: 'exact' }).eq('user_id', user?.id).order('name')
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (debouncedSearchTerm) {
      query = query.ilike('name', `%${debouncedSearchTerm}%`);
    }
    const { data, error, count } = await query;
    if (error) showError("Erro ao buscar fornecedores.");
    else setSuppliers(data || []);
    setHasMore((page + 1) * pageSize < (count || 0));
    setIsLoading(false);
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    setIsDeleting(true);
    try {
      const { count: salesCount, error: salesError } = await supabase
        .from('sales')
        .select('id', { count: 'exact' })
        .eq('supplier_id', supplierId);

      if (salesError) throw salesError;

      if (salesCount > 0) {
        showError("Não é possível deletar este fornecedor. Ele está associado a vendas.");
        return;
      }

      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', supplierId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setSuppliers(prev => prev.filter(supplier => supplier.id !== supplierId));
      showSuccess("Fornecedor deletado com sucesso!");
      fetchSuppliers(); // Refetch to update pagination if needed
    } catch (error: any) {
      console.error("Erro ao deletar fornecedor:", error);
      showError(`Erro ao deletar fornecedor: ${error.message || "Tente novamente."}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nome..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button asChild className="w-full md:w-auto">
          <Link to="/suppliers/new">
            <Plus className="mr-2 h-4 w-4" /> Novo Fornecedor
          </Link>
        </Button>
      </div>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center">Carregando...</TableCell></TableRow>
            ) : suppliers.length > 0 ? (
              suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.contact_person || 'N/A'}</TableCell>
                  <TableCell>{supplier.phone || 'N/A'}</TableCell>
                  <TableCell>{supplier.email || 'N/A'}</TableCell>
                  <TableCell className="text-right flex justify-end space-x-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/suppliers/${supplier.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/suppliers/${supplier.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={isDeleting}>
                          {isDeleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
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
                          <AlertDialogAction onClick={() => handleDeleteSupplier(supplier.id)} disabled={isDeleting}>
                            {isDeleting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deletando...
                              </>
                            ) : (
                              "Deletar"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={5} className="text-center">Nenhum fornecedor encontrado.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-center space-x-4 mt-6">
        <Button onClick={() => setPage(prev => Math.max(0, prev - 1))} disabled={page === 0 || isLoading}>
          <ChevronLeft className="h-4 w-4 mr-2" /> Anterior
        </Button>
        <Button onClick={() => setPage(prev => prev + 1)} disabled={!hasMore || isLoading}>
          Próxima <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}