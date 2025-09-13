import { SaleDetail } from "@/components/sales/SaleDetail";
import { MadeWithDyad } from "@/components/made-with-dyad";

const SaleDetailPage = () => {
  return (
    <div className="p-4">
      <SaleDetail />
      <MadeWithDyad />
    </div>
  );
};

export default SaleDetailPage;