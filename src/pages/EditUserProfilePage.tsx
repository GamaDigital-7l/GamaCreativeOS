import { EditUserProfileForm } from "@/components/user-profile/EditUserProfileForm";
import { GamaLogo } from "@/components/GamaLogo"; // Updated import
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const EditUserProfilePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-primary/10 p-4 sm:p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <CardTitle className="text-3xl text-center flex-grow">Editar Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <EditUserProfileForm />
        </CardContent>
      </Card>
      <GamaLogo /> {/* Using the new GamaLogo component */}
    </div>
  );
};

export default EditUserProfilePage;