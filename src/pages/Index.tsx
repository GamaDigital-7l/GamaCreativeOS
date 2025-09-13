import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useSession } from "@/integrations/supabase/SessionContext";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, LayoutDashboard, Users, PlusCircle, Smartphone, UserCircle2, Package } from "lucide-react";

const Index = () => {
  const { session, isLoading } = useSession();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-xl text-gray-600 dark:text-gray-400">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Bem-vindo ao Sistema de Assistência Técnica</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Comece a gerenciar suas ordens de serviço, vendas e estoque aqui!
        </p>
        {session ? (
          <div className="space-y-4 flex flex-col items-center">
            <Button asChild className="w-64">
              <Link to="/dashboard" className="flex items-center justify-center gap-2">
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Link>
            </Button>
            <Button asChild className="w-64">
              <Link to="/new-service-order">Criar Nova Ordem de Serviço</Link>
            </Button>
            <Button asChild className="w-64">
              <Link to="/service-orders">Ver Ordens de Serviço</Link>
            </Button>
            <Button asChild className="w-64">
              <Link to="/customers" className="flex items-center justify-center gap-2">
                <Users className="h-4 w-4" /> Gerenciar Clientes
              </Link>
            </Button>
            <Button asChild className="w-64">
              <Link to="/devices" className="flex items-center justify-center gap-2">
                <Smartphone className="h-4 w-4" /> Gerenciar Dispositivos
              </Link>
            </Button>
            <Button asChild className="w-64">
              <Link to="/inventory" className="flex items-center justify-center gap-2">
                <Package className="h-4 w-4" /> Gerenciar Estoque
              </Link>
            </Button>
            <Button asChild className="w-64">
              <Link to="/profile" className="flex items-center justify-center gap-2">
                <UserCircle2 className="h-4 w-4" /> Meu Perfil
              </Link>
            </Button>
            <Button variant="outline" onClick={handleLogout} className="w-64 flex items-center justify-center gap-2">
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </div>
        ) : (
          <Button asChild className="w-64">
            <Link to="/login">Fazer Login</Link>
          </Button>
        )}
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;