import { UserProfile } from "@/components/user-profile/UserProfile";
import { GamaCreative } from "@/components/gama-creative";

const UserProfilePage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-primary/10 p-4 sm:p-6">
      <UserProfile />
      <GamaCreative />
    </div>
  );
};

export default UserProfilePage;