import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, CheckCircle, AlertCircle, Camera, X } from 'lucide-react'; // Adicionado X para remover fotos

export default function PhotoUploadPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newSelectedFiles = Array.from(event.target.files);
      setFiles(prevFiles => [...prevFiles, ...newSelectedFiles]);

      const newPreviews = newSelectedFiles.map(file => URL.createObjectURL(file));
      setPreviews(prevPreviews => [...prevPreviews, ...newPreviews]);
      // Clear the input value to allow selecting the same file again if needed
      event.target.value = ''; 
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
    setPreviews(prevPreviews => {
      // Revoke the object URL to free up memory
      URL.revokeObjectURL(prevPreviews[indexToRemove]);
      return prevPreviews.filter((_, index) => index !== indexToRemove);
    });
  };

  const handleUpload = async () => {
    if (!files.length || !id) return;

    setIsUploading(true);
    setUploadError(null);
    const uploadedUrls: string[] = [];

    try {
      for (const file of files) {
        const filePath = `public/${id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('service_order_photos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('service_order_photos')
          .getPublicUrl(filePath);
        
        uploadedUrls.push(publicUrl);
      }

      const { data: existingOrder, error: fetchError } = await supabase
        .from('service_orders')
        .select('photos')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const existingPhotos = existingOrder.photos || [];
      const updatedPhotos = [...existingPhotos, ...uploadedUrls];

      const { error: updateError } = await supabase
        .from('service_orders')
        .update({ photos: updatedPhotos })
        .eq('id', id);

      if (updateError) throw updateError;

      setUploadSuccess(true);
    } catch (error: any) {
      console.error("Upload error:", error);
      setUploadError(`Falha no envio: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Enviar Fotos do Aparelho</CardTitle>
          <CardDescription>OS ID: {id?.substring(0, 8)}...</CardDescription>
        </CardHeader>
        <CardContent>
          {uploadSuccess ? (
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h3 className="text-xl font-semibold">Fotos Enviadas!</h3>
              <p>As fotos foram salvas na Ordem de Serviço. Você já pode fechar esta página.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <Label className="text-lg flex items-center gap-2">
                <Camera className="h-5 w-5" /> Adicionar Fotos do Aparelho
              </Label>
              <p className="text-sm text-muted-foreground -mt-4">
                Tire novas fotos ou selecione da sua galeria. Você pode adicionar várias.
              </p>

              <div className="flex gap-4">
                <input
                  id="take-photo-input"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button 
                  onClick={() => document.getElementById('take-photo-input')?.click()} 
                  className="flex-1"
                  variant="outline"
                >
                  <Camera className="mr-2 h-4 w-4" /> Tirar Foto
                </Button>

                <input
                  id="select-gallery-input"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button 
                  onClick={() => document.getElementById('select-gallery-input')?.click()} 
                  className="flex-1"
                  variant="outline"
                >
                  <Upload className="mr-2 h-4 w-4" /> Selecionar da Galeria
                </Button>
              </div>

              {previews.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {previews.map((src, index) => (
                    <div key={index} className="relative">
                      <img src={src} alt={`Preview ${index}`} className="rounded-md object-cover h-24 w-full" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 rounded-full"
                        onClick={() => handleRemovePhoto(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Button onClick={handleUpload} disabled={isUploading || files.length === 0} className="w-full">
                {isUploading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</>
                ) : (
                  <><Upload className="mr-2 h-4 w-4" /> Enviar Todas as Fotos ({files.length})</>
                )}
              </Button>

              {uploadError && (
                <div className="flex items-center text-red-600">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <p>{uploadError}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}