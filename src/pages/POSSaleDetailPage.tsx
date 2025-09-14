import { POSSaleDetail } from "@/components/pos/POSSaleDetail";
import { MadeWithDyad } from "@/components/made-with-dyad";

const POSSaleDetailPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-primary/10 p-4 sm:p-6">
      <POSSaleDetail />
      <MadeWithDyad />
    </div>
  );
};

export default POSSaleDetailPage;