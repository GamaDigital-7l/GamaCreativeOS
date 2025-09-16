import { GamificationDashboard } from "@/components/gamification/GamificationDashboard";
import { GamaLogo } from "@/components/GamaLogo"; // Updated import

const GamificationPage = () => {
  return (
    <div className="p-4 sm:p-0">
      <GamificationDashboard />
      <GamaLogo /> {/* Using the new GamaLogo component */}
    </div>
  );
};

export default GamificationPage;