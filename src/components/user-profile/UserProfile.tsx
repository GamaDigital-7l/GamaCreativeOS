import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/SessionContext';
import { showError } from '@/utils/toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UserProfileData {
  id: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  email: string; // From auth.users
}

export function UserProfile() {
  const { user, isLoading: isSessionLoading } = useSession();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSessionLoading && user) {
      fetchUserProfile(user.id);
    } else if (!isSessionLoading && !user) {
      navigate('/login');
    }
  }, [user, isSessionLoading, navigate]);

  const fetchUserProfile = async (userId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`first_name, last_name, avatar_url`)
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        throw error;
      }

      setProfile({
        id: userId,
        first_name: data?.first_name || undefined,
        last_name: data?.last_name || undefined,
        avatar_url: data?.avatar_url || undefined,
        email: user?.email || 'N/A',
      });
    } catch (error: any) {
      console.error("Erro ao buscar perfil do usuário:", error);
      showError(`Erro ao carregar perfil: ${error.message || "Tente novamente."}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-gray-600 dark:text-gray-400">Carregando perfil...</p>
      </div>
    );
  }

  if (!user) {
    return <p className="text-center text-red-500">Você precisa estar logado para ver seu perfil.</p>;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="flex flex-row items-center space-x-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <CardTitle className="text-3xl text-center flex-grow">Meu Perfil</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6 p-6">
        <Avatar className="h-24 w-24">
          <AvatarImage src={profile?.avatar_url} alt="Avatar do Usuário" />
          <AvatarFallback>
            <User className="h-12 w-12 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold">
            {profile?.first_name || 'Nome'} {profile?.last_name || 'Sobrenome'}
          </h3>
          <p className="text-muted-foreground">{profile?.email}</p>
        </div>
        <Button className="w-full">
          Editar Perfil
        </Button>
      </CardContent>
    </Card>
  );
}