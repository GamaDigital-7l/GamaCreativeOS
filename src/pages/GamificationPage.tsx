import { GamificationDashboard } from "@/components/gamification/GamificationDashboard";
import { MadeWithDyad } from "@/components/made-with-dyad";

const GamificationPage = () => {
  return (
    <div className="p-4 sm:p-0">
      <GamificationDashboard />
      <MadeWithDyad />
    </div>
  );
};

export default GamificationPage;