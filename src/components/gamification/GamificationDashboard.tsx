import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { RankingList } from './RankingList';
import { UserGoalsProgress } from './UserGoalsProgress';
import { UserAchievements } from './UserAchievements';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError } from '@/utils/toast';
import { Loader2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react'; // Para ícones de conquistas

interface RankingUser {
  id: string;
  rank: number;
  name: string;
  points: number;
  avatarUrl?: string;
  isCurrentUser?: boolean;
}

interface Goal {
  id: string;
  name: string;
  description?: string;
  metric: string;
  targetValue: number;
  currentValue: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType; // Alterado para React.ElementType
  earned: boolean;
}

export function GamificationDashboard() {
  const { user, isLoading: isSessionLoading } = useSession();
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSessionLoading && user) {
      fetchGamificationData();
    } else if (!isSessionLoading && !user) {
      setIsLoading(false);
      // Opcionalmente, redirecionar para o login ou mostrar uma mensagem
    }
  }, [user, isSessionLoading]);

  const fetchGamificationData = async () => {
    setIsLoading(true);
    try {
      // Buscar todos os perfis para o ranking
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, gamification_points')
        .order('gamification_points', { ascending: false });

      if (profilesError) throw profilesError;

      const processedRanking: RankingUser[] = profilesData.map((profile, index) => ({
        id: profile.id,
        rank: index + 1,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Usuário Desconhecido',
        points: profile.gamification_points || 0,
        avatarUrl: profile.avatar_url || undefined,
        isCurrentUser: profile.id === user?.id,
      }));
      setRanking(processedRanking);

      // Buscar metas e progresso do usuário
      const { data: goalsData, error: goalsError } = await supabase
        .from('gamification_goals')
        .select('*'); // Selecionar todas as colunas para metas

      if (goalsError) throw goalsError;

      const { data: userProgressData, error: userProgressError } = await supabase
        .from('gamification_user_progress')
        .select('goal_id, current_value')
        .eq('user_id', user?.id);

      if (userProgressError) throw userProgressError;

      const userProgressMap = new Map(userProgressData.map(p => [p.goal_id, p.current_value]));

      const processedGoals: Goal[] = goalsData.map(goal => ({
        id: goal.id,
        name: goal.name,
        description: goal.description || undefined,
        metric: goal.metric,
        targetValue: goal.target_value,
        currentValue: userProgressMap.get(goal.id) || 0,
      }));
      setGoals(processedGoals);

      // Buscar conquistas e conquistas do usuário
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('gamification_achievements')
        .select('*');

      if (achievementsError) throw achievementsError;

      const { data: userAchievementsData, error: userAchievementsError } = await supabase
        .from('gamification_user_achievements')
        .select('achievement_id')
        .eq('user_id', user?.id);

      if (userAchievementsError) throw userAchievementsError;

      const earnedAchievementIds = new Set(userAchievementsData.map(ua => ua.achievement_id));

      const processedAchievements: Achievement[] = achievementsData.map(ach => {
        const IconComponent = LucideIcons[ach.icon_name as keyof typeof LucideIcons] || LucideIcons.Award;
        return {
          id: ach.id,
          name: ach.name,
          description: ach.description,
          icon: IconComponent, // Atribui o componente diretamente
          earned: earnedAchievementIds.has(ach.id),
        };
      });
      setAchievements(processedAchievements);

    } catch (error: any) {
      console.error("Erro ao carregar dados de gamificação:", error);
      showError(`Erro ao carregar gamificação: ${error.message || "Tente novamente."}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-gray-600 dark:text-gray-400">Carregando dados de gamificação...</p>
      </div>
    );
  }

  if (!user) {
    return <p className="text-center text-red-500">Você precisa estar logado para ver a gamificação.</p>;
  }

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
          <RankingList ranking={ranking} />
        </div>
        <div className="md:col-span-2 space-y-6">
          <UserGoalsProgress goals={goals} />
          <UserAchievements achievements={achievements} />
        </div>
      </div>
    </div>
  );
}