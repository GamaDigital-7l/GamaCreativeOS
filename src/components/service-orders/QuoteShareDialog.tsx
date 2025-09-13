import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy } from "lucide-react";
import { showSuccess } from "@/utils/toast";

interface QuoteShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  serviceOrderId: string;
}

export function QuoteShareDialog({ isOpen, onClose, serviceOrderId }: QuoteShareDialogProps) {
  const quoteUrl = `${window.location.origin}/quote/${serviceOrderId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(quoteUrl);
    showSuccess("Link copiado para a área de transferência!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhar Orçamento</DialogTitle>
          <DialogDescription>
            Envie este link para o cliente aprovar o serviço.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 py-4">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="link" className="sr-only">Link</Label>
            <Input id="link" defaultValue={quoteUrl} readOnly />
          </div>
          <Button type="button" size="sm" className="px-3" onClick={handleCopyLink}>
            <span className="sr-only">Copiar</span>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button type="button" variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}