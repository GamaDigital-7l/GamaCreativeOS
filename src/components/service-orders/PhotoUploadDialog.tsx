import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QRCodeSVG } from "qrcode.react";
import { Copy } from "lucide-react";
import { showSuccess } from "@/utils/toast";

interface PhotoUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  serviceOrderId: string;
}

export function PhotoUploadDialog({ isOpen, onClose, serviceOrderId }: PhotoUploadDialogProps) {
  const uploadUrl = `${window.location.origin}/upload-photos/${serviceOrderId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(uploadUrl);
    showSuccess("Link copiado para a área de transferência!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">Ordem de Serviço Criada!</DialogTitle> {/* Ajustado tamanho do título */}
          <DialogDescription className="text-sm sm:text-base"> {/* Ajustado tamanho do parágrafo */}
            Use o QR code ou o link abaixo no seu celular para enviar as fotos do aparelho.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center space-y-4 py-4">
          <div className="p-4 bg-white rounded-lg">
            <QRCodeSVG value={uploadUrl} size={192} />
          </div>
          <div className="flex w-full items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link" className="sr-only">
                Link
              </Label>
              <Input id="link" defaultValue={uploadUrl} readOnly className="w-full" /> {/* Garantido largura total */}
            </div>
            <Button type="button" size="sm" className="px-3" onClick={handleCopyLink}>
              <span className="sr-only">Copiar</span>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full sm:w-auto"> {/* Garantido largura total em mobile */}
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}