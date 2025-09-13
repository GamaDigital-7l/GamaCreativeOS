import { PointOfSale } from "@/components/pos/PointOfSale";
import { MadeWithDyad } from "@/components/made-with-dyad";

const PointOfSalePage = () => {
  return (
    <div className="p-4">
      <PointOfSale />
      <MadeWithDyad />
    </div>
  );
};

export default PointOfSalePage;