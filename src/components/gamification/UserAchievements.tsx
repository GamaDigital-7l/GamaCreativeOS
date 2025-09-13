import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import * as LucideIcons from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof LucideIcons;
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
          <div className="flex gap-4 flex-wrap">
            {achievements.map((ach) => {
              const Icon = LucideIcons[ach.icon] as React.ElementType;
              return (
                <Tooltip key={ach.id}>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-center gap-2 p-3 border rounded-lg w-24 text-center cursor-pointer hover:bg-accent">
                      {Icon ? <Icon className="h-8 w-8 text-primary" /> : <LucideIcons.Award className="h-8 w-8 text-primary" />}
                      <p className="text-xs font-semibold truncate w-full">{ach.name}</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{ach.description}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}