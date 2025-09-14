"use client";

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button'; // Import Button
import { Card } from '@/components/ui/card';
import { CheckCircle, XCircle, PowerOff } from 'lucide-react';
import { cn } from '@/lib/utils';

type ChecklistStatus = 'ok' | 'not_working';
type ClientChecklistState = Record<string, ChecklistStatus>;

interface ClientChecklistInputProps {
  value: ClientChecklistState;
  onChange: (value: ClientChecklistState) => void;
  isUntestable: boolean;
  onIsUntestableChange: (checked: boolean) => void;
  options: string[];
}

export const ClientChecklistInput: React.FC<ClientChecklistInputProps> = ({
  value,
  onChange,
  isUntestable,
  onIsUntestableChange,
  options,
}) => {
  const handleStatusChange = (item: string, status: ChecklistStatus) => {
    onChange({ ...value, [item]: status });
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center space-x-3">
          <Checkbox
            id="is-untestable"
            checked={isUntestable}
            onCheckedChange={(checked: boolean) => onIsUntestableChange(checked)}
          />
          <Label htmlFor="is-untestable" className="flex items-center gap-2 text-base font-medium">
            <PowerOff className="h-5 w-5 text-orange-500" /> Aparelho entrou desligado / não testável
          </Label>
        </div>
        <p className="text-sm text-muted-foreground mt-1 ml-7">
          Marque esta opção se não foi possível testar os itens do checklist (ex: tela quebrada, não liga).
        </p>
      </Card>

      <div className={cn("grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4", isUntestable && "opacity-50 pointer-events-none")}>
        {options.map((item) => (
          <Card key={item} className="p-3 flex flex-col">
            <Label className="font-medium mb-2 block">{item}</Label>
            <div className="flex gap-2 mt-auto"> {/* Use mt-auto to push buttons to bottom */}
              <Button
                type="button"
                variant={value[item] === 'ok' ? 'default' : 'outline'}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1",
                  value[item] === 'ok' ? "bg-green-600 hover:bg-green-700 text-white" : "text-green-600 border-green-600 hover:bg-green-100"
                )}
                onClick={() => handleStatusChange(item, 'ok')}
              >
                <CheckCircle className="h-4 w-4" /> OK
              </Button>
              <Button
                type="button"
                variant={value[item] === 'not_working' ? 'default' : 'outline'}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1",
                  value[item] === 'not_working' ? "bg-red-600 hover:bg-red-700 text-white" : "text-red-600 border-red-600 hover:bg-red-100"
                )}
                onClick={() => handleStatusChange(item, 'not_working')}
              >
                <XCircle className="h-4 w-4" /> N/F
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};