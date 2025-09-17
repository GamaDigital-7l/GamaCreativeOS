import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils'; // Import cn para classes condicionais

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType; // Alterado para React.ElementType
  earned: boolean; // Para indicar se o usuário a conquistou
}

interface UserAchievementsProps {
  achievements: Achievement[];
}

export function UserAchievements({ achievements }: UserAchievementsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Minhas Conquistas</CardTitle>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          {achievements.length === 0 ? (
            <p className="text-center text-muted-foreground">Nenhuma conquista disponível.</p>
          ) : (
            <div className="flex gap-4 flex-wrap">
              {achievements.map((ach) => {
                const Icon = ach.icon; // Icon já é o componente
                return (
                  <Tooltip key={ach.id}>
                    <TooltipTrigger asChild>
                      <div className={cn(
                        "flex flex-col items-center gap-2 p-3 border rounded-lg w-24 text-center cursor-pointer transition-all",
                        ach.earned ? "bg-primary/10 border-primary text-primary hover:bg-primary/20" : "bg-muted/20 border-border text-muted-foreground opacity-50 hover:opacity-100 hover:bg-muted/40"
                      )}>
                        {Icon ? <Icon className="h-8 w-8" /> : <LucideIcons.Award className="h-8 w-8" />}
                        <p className="text-xs font-semibold truncate w-full">{ach.name}</p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{ach.description}</p>
                      {ach.earned && <p className="text-xs text-green-500 mt-1">Conquistado!</p>}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          )}
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}