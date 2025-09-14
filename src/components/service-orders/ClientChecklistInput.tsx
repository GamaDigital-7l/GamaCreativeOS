"use client";

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'; // Import ToggleGroup components
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
  const handleStatusChange = (item: string, status: ChecklistStatus | null) => {
    if (status) {
      onChange({ ...value, [item]: status });
    } else {
      // If status is null (deselected), remove the item from the state
      const newState = { ...value };
      delete newState[item];
      onChange(newState);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center space-x-3">
          <Checkbox
            id="is-untestable"
            checked={isUntestable}
            onCheckedChange={(checked: boolean) => {
              onIsUntestableChange(checked);
              if (checked) {
                // Clear all checklist items if untestable is checked
                onChange({});
              }
            }}
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
            <ToggleGroup
              type="single"
              value={value[item] || ''}
              onValueChange={(status: string) => handleStatusChange(item, status as ChecklistStatus)}
              className="flex justify-center gap-2 mt-auto"
              disabled={isUntestable}
            >
              <ToggleGroupItem
                value="ok"
                aria-label="Funciona"
                className={cn(
                  "flex-1 flex items-center justify-center gap-1",
                  value[item] === 'ok' ? "bg-green-600 hover:bg-green-700 text-white" : "text-green-600 border-green-600 hover:bg-green-100"
                )}
              >
                <CheckCircle className="h-4 w-4" /> OK
              </ToggleGroupItem>
              <ToggleGroupItem
                value="not_working"
                aria-label="Não Funciona"
                className={cn(
                  "flex-1 flex items-center justify-center gap-1",
                  value[item] === 'not_working' ? "bg-red-600 hover:bg-red-700 text-white" : "text-red-600 border-red-600 hover:bg-red-100"
                )}
              >
                <XCircle className="h-4 w-4" /> N/F
              </ToggleGroupItem>
            </ToggleGroup>
          </Card>
        ))}
      </div>
    </div>
  );
};