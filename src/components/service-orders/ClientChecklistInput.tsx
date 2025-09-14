"use client";

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
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

  const getStatusColor = (item: string) => {
    if (value[item] === 'ok') return 'text-green-500';
    if (value[item] === 'not_working') return 'text-red-500';
    return 'text-muted-foreground';
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
          <Card key={item} className="p-3">
            <Label className="font-medium mb-2 block">{item}</Label>
            <RadioGroup
              value={value[item] || ''}
              onValueChange={(status: ChecklistStatus) => handleStatusChange(item, status)}
              className="flex gap-4 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ok" id={`${item}-ok`} />
                <Label htmlFor={`${item}-ok`} className="flex items-center gap-1 text-green-500">
                  <CheckCircle className="h-4 w-4" /> Funciona
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="not_working" id={`${item}-not_working`} />
                <Label htmlFor={`${item}-not_working`} className="flex items-center gap-1 text-red-500">
                  <XCircle className="h-4 w-4" /> Não Funciona
                </Label>
              </div>
            </RadioGroup>
          </Card>
        ))}
      </div>
    </div>
  );
};