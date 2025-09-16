import { GamificationDashboard } from "@/components/gamification/GamificationDashboard";
import { GamaCreative } from "@/components/gama-creative";

const GamificationPage = () => {
  return (
    <div className="p-4 sm:p-0">
      <GamificationDashboard />
      <GamaCreative />
    </div>
  );
};

export default GamificationPage;