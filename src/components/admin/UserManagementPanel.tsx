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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button';
import { Loader2, User, Edit, Trash2, PlusCircle, Lock, Unlock, CheckCircle, XCircle, Search, Mail, Phone } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  subscription_status: string;
  created_at: string;
  is_blocked: boolean; // Added to reflect ban_until status
}

interface UserFormValues {
  email: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  role: string;
  subscription_status: string;
  is_blocked?: boolean;
}

export function UserManagementPanel() {
  const { user: currentUser, isLoading: isSessionLoading } = useSession();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [formValues, setFormValues] = useState<UserFormValues>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'user',
    subscription_status: 'inactive',
    is_blocked: false,
  });

  useEffect(() => {
    if (!isSessionLoading && currentUser?.role === 'admin') {
      fetchUsers();
    } else if (!isSessionLoading && currentUser?.role !== 'admin') {
      setIsLoading(false);
      showError("Você não tem permissão para acessar este painel.");
    }
  }, [currentUser, isSessionLoading]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('list-users', {
        method: 'GET',
      });

      if (error) throw error;
      setUsers(data as UserProfile[]);
    } catch (error: any) {
      console.error("Erro ao buscar usuários:", error);
      showError(`Erro ao carregar usuários: ${error.message || "Tente novamente."}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setFormValues({
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      role: 'user',
      subscription_status: 'inactive',
      is_blocked: false,
    });
    setIsFormOpen(true);
  };

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setFormValues({
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      subscription_status: user.subscription_status,
      password: '', // Password should not be pre-filled for security
      is_blocked: user.is_blocked,
    });
    setIsFormOpen(true);
  };

  const handleSubmitForm = async () => {
    setIsSubmitting(true);
    try {
      if (editingUser) {
        // Update existing user
        const { error } = await supabase.functions.invoke('manage-user', {
          method: 'POST',
          body: {
            action: 'update',
            userId: editingUser.id,
            email: formValues.email,
            password: formValues.password || undefined, // Only send if provided
            first_name: formValues.first_name,
            last_name: formValues.last_name,
            role: formValues.role,
            subscription_status: formValues.subscription_status,
            is_blocked: formValues.is_blocked,
          },
        });
        if (error) throw error;
        showSuccess("Usuário atualizado com sucesso!");
      } else {
        // Create new user
        const { error } = await supabase.functions.invoke('manage-user', {
          method: 'POST',
          body: {
            action: 'create',
            email: formValues.email,
            password: formValues.password,
            first_name: formValues.first_name,
            last_name: formValues.last_name,
            role: formValues.role,
            subscription_status: formValues.subscription_status,
          },
        });
        if (error) throw error;
        showSuccess("Usuário criado com sucesso!");
      }
      setIsFormOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error("Erro ao salvar usuário:", error);
      showError(`Erro ao salvar usuário: ${error.message || "Tente novamente."}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('manage-user', {
        method: 'POST',
        body: {
          action: 'delete',
          userId,
        },
      });
      if (error) throw error;
      showSuccess("Usuário deletado com sucesso!");
      fetchUsers();
    } catch (error: any) {
      console.error("Erro ao deletar usuário:", error);
      showError(`Erro ao deletar usuário: ${error.message || "Tente novamente."}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBlockUser = async (userId: string, currentBlockedStatus: boolean) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('manage-user', {
        method: 'POST',
        body: {
          action: 'update',
          userId,
          is_blocked: !currentBlockedStatus, // Toggle block status
        },
      });
      if (error) throw error;
      showSuccess(currentBlockedStatus ? "Usuário desbloqueado!" : "Usuário bloqueado!");
      fetchUsers();
    } catch (error: any) {
      console.error("Erro ao bloquear/desbloquear usuário:", error);
      showError(`Erro: ${error.message || "Tente novamente."}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-gray-600 dark:text-gray-400">Carregando usuários...</p>
      </div>
    );
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-4">
        <p className="text-center text-red-500">Você não tem permissão para visualizar este conteúdo.</p>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <CardTitle className="text-2xl flex items-center gap-2"><User className="h-6 w-6 text-primary" /> Gerenciamento de Usuários</CardTitle>
        <Button onClick={handleCreateUser} className="w-full md:w-auto">
          <PlusCircle className="h-4 w-4 mr-2" /> Novo Usuário
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Assinatura</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center">Nenhum usuário encontrado.</TableCell></TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.first_name} {user.last_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.subscription_status === 'active' ? 'success' : 'destructive'}>
                        {user.subscription_status === 'active' ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.id === currentUser?.id ? (
                        <Badge variant="outline">Você</Badge>
                      ) : (
                        <Badge variant={user.is_blocked ? 'destructive' : 'success'}>
                          {user.is_blocked ? 'Bloqueado' : 'Ativo'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right flex justify-end space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {user.id !== currentUser?.id && ( // Prevent admin from blocking/deleting themselves
                        <>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" disabled={isSubmitting}>
                                {isSubmitting ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : user.is_blocked ? (
                                  <Unlock className="h-4 w-4" />
                                ) : (
                                  <Lock className="h-4 w-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {user.is_blocked ? "Desbloquear Usuário?" : "Bloquear Usuário?"}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {user.is_blocked
                                    ? `Esta ação irá desbloquear ${user.first_name || user.email}. Ele poderá fazer login novamente.`
                                    : `Esta ação irá bloquear ${user.first_name || user.email}. Ele não poderá mais fazer login.`}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleBlockUser(user.id, user.is_blocked)} disabled={isSubmitting}>
                                  {isSubmitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : user.is_blocked ? (
                                    "Desbloquear"
                                  ) : (
                                    "Bloquear"
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" disabled={isSubmitting}>
                                {isSubmitting ? (
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
                                  Esta ação não pode ser desfeita. Isso excluirá permanentemente o usuário {user.first_name} {user.last_name} e todos os dados associados.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteUser(user.id)} disabled={isSubmitting}>
                                  {isSubmitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    "Deletar"
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Editar Usuário" : "Criar Novo Usuário"}</DialogTitle>
            <DialogDescription>
              {editingUser ? "Faça alterações no perfil do usuário." : "Preencha os detalhes para criar um novo usuário."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input
                id="email"
                type="email"
                value={formValues.email}
                onChange={(e) => setFormValues({ ...formValues, email: e.target.value })}
                className="col-span-3"
                disabled={isSubmitting}
              />
            </div>
            {!editingUser && ( // Only show password field for new users
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={formValues.password}
                  onChange={(e) => setFormValues({ ...formValues, password: e.target.value })}
                  className="col-span-3"
                  disabled={isSubmitting}
                />
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="first_name" className="text-right">Primeiro Nome</Label>
              <Input
                id="first_name"
                value={formValues.first_name}
                onChange={(e) => setFormValues({ ...formValues, first_name: e.target.value })}
                className="col-span-3"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="last_name" className="text-right">Sobrenome</Label>
              <Input
                id="last_name"
                value={formValues.last_name}
                onChange={(e) => setFormValues({ ...formValues, last_name: e.target.value })}
                className="col-span-3"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">Papel</Label>
              <Select value={formValues.role} onValueChange={(value) => setFormValues({ ...formValues, role: value })} disabled={isSubmitting}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o papel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subscription_status" className="text-right">Assinatura</Label>
              <Select value={formValues.subscription_status} onValueChange={(value) => setFormValues({ ...formValues, subscription_status: value })} disabled={isSubmitting}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Status da assinatura" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="inactive">Inativa</SelectItem>
                  <SelectItem value="trial">Teste</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>Cancelar</Button>
            <Button onClick={handleSubmitForm} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingUser ? "Salvar Alterações" : "Criar Usuário"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}