import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy } from 'lucide-react';

interface RankingUser {
  id: string;
  rank: number;
  name: string;
  points: number;
  avatarUrl?: string;
  isCurrentUser?: boolean;
}

interface RankingListProps {
  ranking: RankingUser[];
}

export function RankingList({ ranking }: RankingListProps) {
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-orange-500';
    return 'text-muted-foreground';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ranking da Semana</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {ranking.length === 0 ? (
            <p className="text-center text-muted-foreground">Nenhum usuário no ranking.</p>
          ) : (
            ranking.map((user) => (
              <li key={user.id} className={`flex items-center gap-4 p-2 rounded-lg ${user.isCurrentUser ? 'bg-primary/10 ring-2 ring-primary' : ''}`}>
                <div className="flex items-center gap-2 w-8">
                  <Trophy className={`h-5 w-5 ${getRankColor(user.rank)}`} />
                  <span className="font-bold">{user.rank}</span>
                </div>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.points} pontos</p>
                </div>
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  );
}