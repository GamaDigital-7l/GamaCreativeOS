import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';

interface SignaturePadProps {
  onSave: (signature: string) => void;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave }) => {
  const sigPad = useRef<SignatureCanvas>(null);

  const clear = () => {
    sigPad.current?.clear();
  };

  const save = () => {
    if (sigPad.current?.isEmpty()) {
      alert("Por favor, forneça uma assinatura.");
    } else {
      const signature = sigPad.current?.toDataURL('image/svg+xml') || '';
      onSave(signature);
    }
  };

  return (
    <div className="space-y-2">
      <div className="border rounded-md">
        <SignatureCanvas
          ref={sigPad}
          penColor="black"
          canvasProps={{ className: 'w-full h-40' }}
        />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={clear} type="button">Limpar</Button>
        <Button onClick={save} type="button">Confirmar e Aprovar Orçamento</Button>
      </div>
    </div>
  );
};