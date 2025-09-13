import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import * as LucideIcons from 'lucide-react'; // Importa todos os ícones Lucide

type PointStatus = 'ok' | 'damaged' | 'scratched' | 'not_working';
type ChecklistState = Record<string, PointStatus>;

interface VisualChecklistProps {
  value: ChecklistState;
  onChange: (value: ChecklistState) => void;
}

// Mapeamento de IDs para ícones e rótulos
const pointDefinitions = {
  front_screen: { icon: LucideIcons.Monitor, label: 'Tela Frontal' },
  front_camera: { icon: LucideIcons.Camera, label: 'Câmera Frontal' },
  earpiece: { icon: LucideIcons.Ear, label: 'Auricular' },
  volume_buttons_left: { icon: LucideIcons.Volume2, label: 'Vol. (Esq)' },
  power_button_right: { icon: LucideIcons.Power, label: 'Power (Dir)' },
  charging_port: { icon: LucideIcons.BatteryCharging, label: 'Carga' },
  speaker_bottom: { icon: LucideIcons.Speaker, label: 'Alto-falante' },
  microphone_bottom: { icon: LucideIcons.Mic, label: 'Microfone' },
  back_panel: { icon: LucideIcons.Square, label: 'Tampa Tras.' },
  back_camera: { icon: LucideIcons.Camera, label: 'Câmera Tras.' },
  flash: { icon: LucideIcons.Zap, label: 'Flash' },
  logo_back: { icon: LucideIcons.Apple, label: 'Logo' }, // Exemplo, pode ser um ícone genérico
};

const frontPoints = [
  { id: 'front_screen', cx: '50%', cy: '45%', width: '60', height: '30' },
  { id: 'front_camera', cx: '50%', cy: '8%', width: '30', height: '20' },
  { id: 'earpiece', cx: '50%', cy: '15%', width: '40', height: '15' },
  { id: 'volume_buttons_left', cx: '8%', cy: '30%', width: '30', height: '20' },
  { id: 'power_button_right', cx: '92%', cy: '30%', width: '30', height: '20' },
  { id: 'charging_port', cx: '50%', cy: '94%', width: '30', height: '20' },
  { id: 'speaker_bottom', cx: '35%', cy: '94%', width: '30', height: '20' },
  { id: 'microphone_bottom', cx: '65%', cy: '94%', width: '30', height: '20' },
];

const backPoints = [
  { id: 'back_panel', cx: '50%', cy: '50%', width: '60', height: '30' },
  { id: 'back_camera', cx: '25%', cy: '12%', width: '30', height: '20' },
  { id: 'flash', cx: '35%', cy: '12%', width: '20', height: '20' },
  { id: 'logo_back', cx: '50%', cy: '70%', width: '30', height: '20' },
];

const statusOptions: { value: PointStatus; label: string }[] = [
  { value: 'ok', label: 'Intacto / OK' },
  { value: 'scratched', label: 'Riscado' },
  { value: 'damaged', label: 'Trincado / Danificado' },
  { value: 'not_working', label: 'Não Funciona' },
];

const getStatusColor = (status?: PointStatus) => {
  switch (status) {
    case 'ok': return 'bg-green-500';
    case 'scratched': return 'bg-yellow-500';
    case 'damaged': return 'bg-orange-500';
    case 'not_working': return 'bg-red-500';
    default: return 'bg-gray-400';
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
            {/* Earpiece visual */}
            <rect x="55" y="20" width="40" height="4" rx="2" fill="#d1d5db" />
          </>
        )}

        {currentPoints.map((point) => {
          const PointIcon = pointDefinitions[point.id]?.icon;
          const pointLabel = pointDefinitions[point.id]?.label;
          const x = parseFloat(point.cx) - parseFloat(point.width) / 2;
          const y = parseFloat(point.cy) - parseFloat(point.height) / 2;

          return (
            <foreignObject x={x} y={y} width={point.width} height={point.height} key={point.id}>
              <Popover>
                <PopoverTrigger asChild>
                  <div className={`flex flex-col items-center justify-center w-full h-full rounded-md text-xs ${getStatusColor(value[point.id])} cursor-pointer opacity-70 hover:opacity-100 transition-opacity p-1 text-white`}>
                    {PointIcon && <PointIcon className="h-4 w-4" />}
                    <span className="leading-none text-center">{pointLabel}</span>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto">
                  <div className="space-y-2">
                    <p className="font-semibold">{pointDefinitions[point.id]?.label}</p>
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
            </foreignObject>
          );
        })}
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