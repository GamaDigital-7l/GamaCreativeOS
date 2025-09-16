import { EditDeviceForm } from "@/components/devices/EditDeviceForm";
import { GamaCreative } from "@/components/gama-creative";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings, Smartphone } from "lucide-react"; // Adicionado Settings, Smartphone icons
import { useNavigate, useParams } from "react-router-dom";

const EditDevicePage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-primary/10 p-4 sm:p-6">
      <Card className="w-full max-w-3xl">
        <CardHeader className="flex flex-row items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/devices/${id}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <CardTitle className="text-3xl text-center flex-grow flex items-center justify-center gap-2">
            <Smartphone className="h-7 w-7 text-primary" /> Editar Dispositivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EditDeviceForm />
        </CardContent>
      </Card>
      <GamaCreative />
    </div>
  );
};

export default EditDevicePage;