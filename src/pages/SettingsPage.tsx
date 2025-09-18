import { SettingsForm } from "@/components/settings/SettingsForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings, ListPlus, FileUp, Trophy } from "lucide-react"; // Added FileUp and Trophy icons
import { useNavigate } from "react-router-dom";

const SettingsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-primary/10 p-4 sm:p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="flex flex-row items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <CardTitle className="text-3xl text-center flex-grow">Configurações</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsForm />
          <div className="mt-8 pt-6 border-t border-border">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Settings className="h-6 w-6 text-primary" /> Configurações Avançadas
            </h2>
            <div className="grid gap-4"> {/* Usar grid para organizar os botões */}
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/settings/custom-fields')}>
                <ListPlus className="mr-2 h-4 w-4" /> Gerenciar Campos da Ordem de Serviço
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/import-service-orders')}>
                <FileUp className="mr-2 h-4 w-4" /> Importar Ordens de Serviço
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/gamification/manage')}>
                <Trophy className="mr-2 h-4 w-4" /> Gerenciar Gamificação
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;