"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PlusCircle, Edit, Trash2, Loader2, Settings, List, Type } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CustomFieldForm } from '@/components/settings/CustomFieldForm';
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
import { Badge } from '@/components/ui/badge';
import { GamaCreative } from '@/components/gama-creative';

interface CustomField {
  id: string;
  field_name: string;
  field_type: string;
  is_required: boolean;
  options?: string[];
  order_index: number;
}

export default function ManageCustomFieldsPage() {
  const navigate = useNavigate();
  const { user } = useSession();
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | undefined>(undefined);
  const [deletingFieldId, setDeletingFieldId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchCustomFields();
    }
  }, [user]);

  const fetchCustomFields = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_order_custom_fields')
        .select('*')
        .eq('user_id', user?.id)
        .order('order_index', { ascending: true })
        .order('field_name', { ascending: true });
      if (error) throw error;
      setCustomFields(data || []);
    } catch (error: any) {
      showError(`Erro ao carregar campos personalizados: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewField = () => {
    setEditingFieldId(undefined);
    setIsFormOpen(true);
  };

  const handleEditField = (fieldId: string) => {
    setEditingFieldId(fieldId);
    setIsFormOpen(true);
  };

  const handleDeleteField = async (fieldId: string) => {
    setDeletingFieldId(fieldId);
    try {
      // Check if field is linked to any service order field values
      const { count: valuesCount, error: valuesError } = await supabase
        .from('service_order_field_values')
        .select('id', { count: 'exact' })
        .eq('custom_field_id', fieldId);

      if (valuesError) throw valuesError;

      if (valuesCount > 0) {
        showError("Não é possível deletar este campo. Ele está associado a valores em ordens de serviço existentes.");
        return;
      }

      const { error } = await supabase.from('service_order_custom_fields').delete().eq('id', fieldId).eq('user_id', user?.id);
      if (error) throw error;
      showSuccess("Campo personalizado deletado com sucesso!");
      fetchCustomFields();
    } catch (error: any) {
      showError(`Erro ao deletar campo: ${error.message}`);
    } finally {
      setDeletingFieldId(null);
    }
  };

  const getFieldTypeLabel = (type: string) => {
    switch (type) {
      case 'text': return 'Texto Curto';
      case 'textarea': return 'Texto Longo';
      case 'select': return 'Seleção Única';
      case 'checkbox': return 'Múltipla Escolha';
      default: return type;
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-background to-primary/10 p-4 sm:p-6">
      <Card className="w-full max-w-4xl mb-6">
        <CardHeader className="flex flex-row items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <CardTitle className="text-3xl text-center flex-grow flex items-center justify-center gap-2">
            <Settings className="h-7 w-7 text-primary" /> Gerenciar Campos da OS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4">
            <Button onClick={handleNewField}><PlusCircle className="mr-2 h-4 w-4" /> Novo Campo</Button>
          </div>

          <div className="space-y-4">
            {customFields.length === 0 ? (
              <p className="text-muted-foreground text-center">Nenhum campo personalizado criado ainda.</p>
            ) : (
              customFields.map(field => (
                <Card key={field.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-semibold">{field.field_name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Type className="h-3 w-3" /> Tipo: <Badge variant="outline">{getFieldTypeLabel(field.field_type)}</Badge>
                      {field.is_required && <Badge variant="destructive">Obrigatório</Badge>}
                      {field.options && field.options.length > 0 && (
                        <span className="ml-2">Opções: {field.options.join(', ')}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditField(field.id)}><Edit className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={deletingFieldId === field.id}>
                          {deletingFieldId === field.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Tem certeza que deseja deletar este campo?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o campo personalizado.
                            Se este campo estiver associado a valores em ordens de serviço existentes, a exclusão não será permitida.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteField(field.id)} disabled={deletingFieldId === field.id}>
                            {deletingFieldId === field.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Deletar"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingFieldId ? "Editar Campo Personalizado" : "Novo Campo Personalizado"}</DialogTitle>
          </DialogHeader>
          <CustomFieldForm fieldId={editingFieldId} onSuccess={() => { setIsFormOpen(false); fetchCustomFields(); }} />
        </DialogContent>
      </Dialog>
      <GamaCreative />
    </div>
  );
}