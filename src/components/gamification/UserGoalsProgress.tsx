import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface Goal {
  id: string;
  name: string;
  description?: string;
  currentValue: number;
  targetValue: number;
  metric: string;
}

interface UserGoalsProgressProps {
  goals: Goal[];
}

export function UserGoalsProgress({ goals }: UserGoalsProgressProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Minhas Metas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {goals.length === 0 ? (
          <p className="text-center text-muted-foreground">Nenhuma meta definida ou em progresso.</p>
        ) : (
          goals.map((goal) => {
            const progress = Math.min((goal.currentValue / goal.targetValue) * 100, 100);
            return (
              <div key={goal.id}>
                <div className="flex justify-between items-baseline mb-1">
                  <p className="font-medium">{goal.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {goal.metric === 'R$' ? 'R$ ' : ''}{goal.currentValue.toLocaleString('pt-BR')} / {goal.targetValue.toLocaleString('pt-BR')} {goal.metric !== 'R$' ? goal.metric : ''}
                  </p>
                </div>
                <Progress value={progress} />
                {goal.description && <p className="text-xs text-muted-foreground mt-1">{goal.description}</p>}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}