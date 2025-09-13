import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RankingList } from './RankingList';
import { UserGoalsProgress } from './UserGoalsProgress';
import { UserAchievements } from './UserAchievements';

// Dados de exemplo para visualização
const mockRanking = [
  { rank: 1, name: 'Ana Silva', points: 1250, avatarUrl: 'https://i.pravatar.cc/150?u=ana' },
  { rank: 2, name: 'Bruno Costa', points: 1100, avatarUrl: 'https://i.pravatar.cc/150?u=bruno' },
  { rank: 3, name: 'Carlos Dias', points: 980, avatarUrl: 'https://i.pravatar.cc/150?u=carlos' },
  { rank: 4, name: 'Você', points: 850, avatarUrl: 'https://i.pravatar.cc/150?u=voce', isCurrentUser: true },
  { rank: 5, name: 'Daniela Lima', points: 720, avatarUrl: 'https://i.pravatar.cc/150?u=daniela' },
];

const mockGoals = [
  { id: '1', name: 'Vendas do Mês', currentValue: 7500, targetValue: 10000, metric: 'R$' },
  { id: '2', name: 'OS Concluídas', currentValue: 42, targetValue: 50, metric: 'OS' },
  { id: '3', name: 'Venda de Acessórios', currentValue: 15, targetValue: 25, metric: 'Itens' },
];

const mockAchievements = [
  { id: '1', name: 'Vendedor Mestre', description: 'Bateu a meta de vendas por 3 meses seguidos.', icon: 'Gem' },
  { id: '2', name: 'Rei do Reparo', description: 'Concluiu 100 Ordens de Serviço.', icon: 'Wrench' },
  { id: '3', name: 'Início Rápido', description: 'Bateu a meta na primeira semana do mês.', icon: 'Zap' },
  { id: '4', name: 'Cliente Feliz', description: 'Recebeu 10 avaliações 5 estrelas.', icon: 'Star' },
];

export function GamificationDashboard() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Placar de Metas</CardTitle>
          <CardDescription>Acompanhe seu desempenho, suba no ranking e ganhe recompensas!</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <RankingList ranking={mockRanking} />
        </div>
        <div className="md:col-span-2 space-y-6">
          <UserGoalsProgress goals={mockGoals} />
          <UserAchievements achievements={mockAchievements} />
        </div>
      </div>
    </div>
  );
}