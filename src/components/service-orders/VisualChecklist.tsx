import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Smartphone, RotateCcw } from 'lucide-react';

type PointStatus = 'ok' | 'damaged' | 'scratched' | 'not_working';
type ChecklistState = Record<string, PointStatus>;

interface VisualChecklistProps {
  value: ChecklistState;
  onChange: (value: ChecklistState) => void;
}

const frontPoints = [
  { id: 'front_screen', cx: '50%', cy: '45%', r: '12', label: 'Tela Frontal' },
  { id: 'front_camera', cx: '50%', cy: '8%', r: '5', label: 'Câmera Frontal' },
  { id: 'earpiece', cx: '50%', cy: '15%', r: '4', label: 'Auricular' },
  { id: 'volume_buttons_left', cx: '8%', cy: '30%', r: '6', label: 'Botões Volume (Esq)' },
  { id: 'power_button_right', cx: '92%', cy: '30%', r: '6', label: 'Botão Power (Dir)' },
  { id: 'charging_port', cx: '50%', cy: '94%', r: '6', label: 'Conector de Carga' },
  { id: 'speaker_bottom', cx: '35%', cy: '94%', r: '4', label: 'Alto-falante (Inf)' },
  { id: 'microphone_bottom', cx: '65%', cy: '94%', r: '4', label: 'Microfone (Inf)' },
];

const backPoints = [
  { id: 'back_panel', cx: '50%', cy: '50%', r: '15', label: 'Tampa Traseira' },
  { id: 'back_camera', cx: '25%', cy: '12%', r: '8', label: 'Câmera Traseira' },
  { id: 'flash', cx: '35%', cy: '12%', r: '4', label: 'Flash' },
  { id: 'logo_back', cx: '50%', cy: '70%', r: '8', label: 'Logo Traseira' },
];

const statusOptions: { value: PointStatus; label: string }[] = [
  { value: 'ok', label: 'Intacto / OK' },
  { value: 'scratched', label: 'Riscado' },
  { value: 'damaged', label: 'Trincado / Danificado' },
  { value: 'not_working', label: 'Não Funciona' },
];

const getStatusColor = (status?: PointStatus) => {
  switch (status) {
    case 'ok': return 'fill-green-500';
    case 'scratched': return 'fill-yellow-500';
    case 'damaged': return 'fill-orange-500';
    case 'not_working': return 'fill-red-500';
    default: return 'fill-gray-400';
  }
};

export function VisualChecklist({ value, onChange }: VisualChecklistProps) {
  const [view, setView] = useState<'front' | 'back'>('front');

  const handleStatusChange = (pointId: string, newStatus: PointStatus) => {
    onChange({ ...value, [pointId]: newStatus });
  };

  const renderPhoneSVG = (isFront: boolean) => {
    const currentPoints = isFront ? frontPoints : backPoints;
    const phoneFill = isFront ? '#f3f4f6' : '#e5e7eb'; // Slightly different shade for back
    const screenFill = isFront ? '#e5e7eb' : '#f3f4f6'; // Screen is darker on front, lighter on back

    return (
      <svg viewBox="0 0 150 300" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
        {/* Phone Body */}
        <rect x="5" y="5" width="140" height="290" rx="25" fill={phoneFill} stroke="#9ca3af" strokeWidth="2" />
        {/* Screen / Back Panel */}
        <rect x="15" y="15" width="120" height="270" rx="15" fill={screenFill} />

        {isFront && (
          <>
            {/* Earpiece */}
            <rect x="55" y="20" width="40" height="4" rx="2" fill="#d1d5db" />
          </>
        )}

        {currentPoints.map((point) => (
          <Popover key={point.id}>
            <PopoverTrigger asChild>
              <circle
                cx={point.cx}
                cy={point.cy}
                r={point.r}
                className={`${getStatusColor(value[point.id])} cursor-pointer opacity-70 hover:opacity-100 transition-opacity`}
              />
            </PopoverTrigger>
            <PopoverContent className="w-auto">
              <div className="space-y-2">
                <p className="font-semibold">{point.label}</p>
                <RadioGroup
                  value={value[point.id]}
                  onValueChange={(newStatus: PointStatus) => handleStatusChange(point.id, newStatus)}
                >
                  {statusOptions.map((opt) => (
                    <div key={opt.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt.value} id={`${point.id}-${opt.value}`} />
                      <Label htmlFor={`${point.id}-${opt.value}`}>{opt.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </PopoverContent>
          </Popover>
        ))}
      </svg>
    );
  };

  return (
    <div className="relative w-full max-w-xs mx-auto border rounded-lg p-2">
      <div className="flex justify-center gap-2 mb-2">
        <Button variant={view === 'front' ? 'default' : 'outline'} size="sm" onClick={() => setView('front')}>Frente</Button>
        <Button variant={view === 'back' ? 'default' : 'outline'} size="sm" onClick={() => setView('back')}>Verso</Button>
      </div>
      {view === 'front' ? renderPhoneSVG(true) : renderPhoneSVG(false)}
    </div>
  );
}