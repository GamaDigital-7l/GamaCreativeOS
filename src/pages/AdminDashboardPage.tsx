import { UserManagementPanel } from "@/components/admin/UserManagementPanel";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSession } from "@/integrations/supabase/SessionContext";
import { useEffect } from "react";

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useSession();

  useEffect(() => {
    if (!isLoading && user?.role !== 'admin') {
      navigate('/'); // Redirect non-admins to home
    }
  }, [user, isLoading, navigate]);

  if (isLoading || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-primary/10 p-4 sm:p-6">
        <p className="text-center text-gray-600 dark:text-gray-400">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-background to-primary/10 p-4 sm:p-6">
      <Card className="w-full max-w-6xl mb-6">
        <CardHeader className="flex flex-row items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <CardTitle className="text-3xl text-center flex-grow flex items-center justify-center gap-2">
            <ShieldCheck className="h-7 w-7 text-primary" /> Painel de Administração
          </CardTitle>
        </CardHeader>
        <UserManagementPanel />
      </Card>
    </div>
  );
};

export default AdminDashboardPage;