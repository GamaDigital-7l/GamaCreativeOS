import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PlusCircle, Edit, Trash2, Loader2, Goal as GoalIcon, Trophy, CheckCircle, XCircle, Scale, Clock, DollarSign, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { GoalForm } from '@/components/gamification/GoalForm';
import { AchievementForm } from '@/components/gamification/AchievementForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import * as LucideIcons from 'lucide-react'; // Para ícones de conquistas
import { GamaCreative } from '@/components/gama-creative';

interface Goal {
  id: string;
  name: string;
  description?: string;
  metric: string;
  target_value: number;
  period: string;
  start_date: string;
  end_date: string;
  scope: string;
  is_active: boolean;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  points_reward: number;
}

export default function ManageGamificationPage() {
  const navigate = useNavigate();
  const { user } = useSession();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);
  const [isAchievementFormOpen, setIsAchievementFormOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | undefined>(undefined);
  const [editingAchievementId, setEditingAchievementId] = useState<string | undefined>(undefined);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
  const [deletingAchievementId, setDeletingAchievementId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchGamificationData();
    }
  }, [user]);

  const fetchGamificationData = async () => {
    setIsLoading(true);
    try {
      const { data: goalsData, error: goalsError } = await supabase
        .from('gamification_goals')
        .select('*')
        .eq('created_by', user?.id)
        .order('name', { ascending: true });
      if (goalsError) throw goalsError;
      setGoals(goalsData || []);

      const { data: achievementsData, error: achievementsError } = await supabase
        .from('gamification_achievements')
        .select('*')
        .order('name', { ascending: true });
      if (achievementsError) throw achievementsError;
      setAchievements(achievementsData || []);

    } catch (error: any) {
      showError(`Erro ao carregar dados de gamificação: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewGoal = () => {
    setEditingGoalId(undefined);
    setIsGoalFormOpen(true);
  };

  const handleEditGoal = (goalId: string) => {
    setEditingGoalId(goalId);
    setIsGoalFormOpen(true);
  };

  const handleDeleteGoal = async (goalId: string) => {
    setDeletingGoalId(goalId);
    try {
      const { error } = await supabase.from('gamification_goals').delete().eq('id', goalId).eq('created_by', user?.id);
      if (error) throw error;
      showSuccess("Meta deletada com sucesso!");
      fetchGamificationData();
    } catch (error: any) {
      showError(`Erro ao deletar meta: ${error.message}`);
    } finally {
      setDeletingGoalId(null);
    }
  };

  const handleNewAchievement = () => {
    setEditingAchievementId(undefined);
    setIsAchievementFormOpen(true);
  };

  const handleEditAchievement = (achievementId: string) => {
    setEditingAchievementId(achievementId);
    setIsAchievementFormOpen(true);
  };

  const handleDeleteAchievement = async (achievementId: string) => {
    setDeletingAchievementId(achievementId);
    try {
      const { error } = await supabase.from('gamification_achievements').delete().eq('id', achievementId);
      if (error) throw error;
      showSuccess("Conquista deletada com sucesso!");
      fetchGamificationData();
    } catch (error: any) {
      showError(`Erro ao deletar conquista: ${error.message}`);
    } finally {
      setDeletingAchievementId(null);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-background to-primary/10 p-4 sm:p-6">
      <Card className="w-full max-w-6xl mb-6">
        <CardHeader className="flex flex-row items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/gamification')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <CardTitle className="text-3xl text-center flex-grow flex items-center justify-center gap-2">
            <Trophy className="h-7 w-7 text-primary" /> Gerenciar Gamificação
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Metas */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-semibold flex items-center gap-2"><GoalIcon className="h-6 w-6" /> Metas</h3>
              <Button onClick={handleNewGoal}><PlusCircle className="mr-2 h-4 w-4" /> Nova Meta</Button>
            </div>
            <div className="space-y-4">
              {goals.length === 0 ? (
                <p className="text-muted-foreground text-center">Nenhuma meta criada ainda.</p>
              ) : (
                goals.map(goal => (
                  <Card key={goal.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-semibold">{goal.name}</p>
                      <p className="text-sm text-muted-foreground">{goal.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Scale className="h-3 w-3" /> {goal.metric}: {goal.target_value} |
                        <Clock className="h-3 w-3" /> Período: {goal.period} |
                        <CheckCircle className="h-3 w-3" /> Ativa: {goal.is_active ? 'Sim' : 'Não'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditGoal(goal.id)}><Edit className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" disabled={deletingGoalId === goal.id}>
                            {deletingGoalId === goal.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Tem certeza que deseja deletar esta meta?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. Isso excluirá permanentemente a meta.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteGoal(goal.id)} disabled={deletingGoalId === goal.id}>
                              {deletingGoalId === goal.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Deletar"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Conquistas */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-semibold flex items-center gap-2"><Sparkles className="h-6 w-6" /> Conquistas</h3>
              <Button onClick={handleNewAchievement}><PlusCircle className="mr-2 h-4 w-4" /> Nova Conquista</Button>
            </div>
            <div className="space-y-4">
              {achievements.length === 0 ? (
                <p className="text-muted-foreground text-center">Nenhuma conquista criada ainda.</p>
              ) : (
                achievements.map(achievement => {
                  const Icon = LucideIcons[achievement.icon_name as keyof typeof LucideIcons] || LucideIcons.Award;
                  return (
                    <Card key={achievement.id} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <Icon className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-semibold">{achievement.name}</p>
                          <p className="text-sm text-muted-foreground">{achievement.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">Recompensa: {achievement.points_reward} pontos</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditAchievement(achievement.id)}><Edit className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" disabled={deletingAchievementId === achievement.id}>
                              {deletingAchievementId === achievement.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Tem certeza que deseja deletar esta conquista?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. Isso excluirá permanentemente a conquista.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteAchievement(achievement.id)} disabled={deletingAchievementId === achievement.id}>
                                {deletingAchievementId === achievement.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Deletar"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goal Form Dialog */}
      <Dialog open={isGoalFormOpen} onOpenChange={setIsGoalFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingGoalId ? "Editar Meta" : "Nova Meta"}</DialogTitle>
          </DialogHeader>
          <GoalForm goalId={editingGoalId} onSuccess={() => { setIsGoalFormOpen(false); fetchGamificationData(); }} />
        </DialogContent>
      </Dialog>

      {/* Achievement Form Dialog */}
      <Dialog open={isAchievementFormOpen} onOpenChange={setIsAchievementFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingAchievementId ? "Editar Conquista" : "Nova Conquista"}</DialogTitle>
          </DialogHeader>
          <AchievementForm achievementId={editingAchievementId} onSuccess={() => { setIsAchievementFormOpen(false); fetchGamificationData(); }} />
        </DialogContent>
      </Dialog>
      <GamaCreative />
    </div>
  );
}