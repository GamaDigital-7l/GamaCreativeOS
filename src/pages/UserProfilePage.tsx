import { UserProfile } from "@/components/user-profile/UserProfile";
import { MadeWithDyad } from "@/components/made-with-dyad";

const UserProfilePage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <UserProfile />
      <MadeWithDyad />
    </div>
  );
};

export default UserProfilePage;