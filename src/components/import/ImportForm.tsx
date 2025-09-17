import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ImportReportEntry {
  os_number: string;
  status: 'created' | 'updated' | 'skipped' | 'failed';
  messages: string[];
}

export function ImportForm() {
  const { user } = useSession();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [importReport, setImportReport] = useState<ImportReportEntry[] | null>(null);
  const [overallStatus, setOverallStatus] = useState<'success' | 'error' | 'warning' | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
      setImportReport(null);
      setOverallStatus(null);
    } else {
      setSelectedFile(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !user) {
      showError("Por favor, selecione um arquivo e certifique-se de estar logado.");
      return;
    }

    setIsUploading(true);
    setImportReport(null);
    setOverallStatus(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('user_id', user.id);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/import-service-orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await supabase.auth.getSession().then(s => s.data.session?.access_token)}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro na importação: ${response.statusText}`);
      }

      const report: ImportReportEntry[] = await response.json();
      setImportReport(report);

      const hasErrors = report.some(entry => entry.status === 'failed');
      const hasWarnings = report.some(entry => entry.status === 'updated' || entry.messages.some(msg => msg.startsWith('Warning')));
      
      if (hasErrors) {
        setOverallStatus('error');
        showError("Importação concluída com falhas. Verifique o relatório.");
      } else if (hasWarnings) {
        setOverallStatus('warning');
        showSuccess("Importação concluída com advertências. Verifique o relatório.");
      } else {
        setOverallStatus('success');
        showSuccess("Importação concluída com sucesso!");
      }

    } catch (error: any) {
      console.error("Erro ao importar OS:", error);
      showError(error.message || "Erro desconhecido ao importar Ordens de Serviço.");
      setOverallStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Upload className="h-6 w-6 text-primary" /> Importar Ordens de Serviço</CardTitle>
        <CardDescription>
          Faça upload de arquivos PDF, CSV ou Excel do ShoFicina para importar suas Ordens de Serviço.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="os-file" className="mb-2 block">Selecionar Arquivo (.pdf, .csv, .xlsx)</Label>
          <Input 
            id="os-file" 
            type="file" 
            accept=".pdf,.csv,.xlsx" 
            onChange={handleFileChange} 
            className="file:text-primary file:font-semibold"
            disabled={isUploading}
          />
          {selectedFile && (
            <p className="text-sm text-muted-foreground mt-2">Arquivo selecionado: <span className="font-medium">{selectedFile.name}</span></p>
          )}
        </div>

        <Button 
          onClick={handleImport} 
          disabled={!selectedFile || isUploading} 
          className="w-full"
        >
          {isUploading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importando...</>
          ) : (
            <><Upload className="mr-2 h-4 w-4" /> Iniciar Importação</>
          )}
        </Button>

        {importReport && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              {overallStatus === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
              {overallStatus === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
              {overallStatus === 'warning' && <AlertCircle className="h-5 w-5 text-yellow-500" />}
              Relatório de Importação
            </h3>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº OS</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Mensagens</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importReport.map((entry, index) => (
                    <TableRow key={index} className={
                      entry.status === 'failed' ? 'bg-red-50' :
                      entry.status === 'updated' ? 'bg-yellow-50' :
                      entry.status === 'created' ? 'bg-green-50' : ''
                    }>
                      <TableCell className="font-medium">{entry.os_number}</TableCell>
                      <TableCell>
                        {entry.status === 'created' && <span className="text-green-600">Criado</span>}
                        {entry.status === 'updated' && <span className="text-yellow-600">Atualizado</span>}
                        {entry.status === 'skipped' && <span className="text-gray-600">Ignorado</span>}
                        {entry.status === 'failed' && <span className="text-red-600">Falha</span>}
                      </TableCell>
                      <TableCell>
                        <ul className="list-disc list-inside text-sm">
                          {entry.messages.map((msg, msgIndex) => (
                            <li key={msgIndex} className={msg.startsWith('Error') ? 'text-red-500' : msg.startsWith('Warning') ? 'text-yellow-500' : 'text-gray-700'}>
                              {msg}
                            </li>
                          ))}
                        </ul>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}