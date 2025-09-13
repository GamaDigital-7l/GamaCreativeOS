import { InventoryItemDetail } from "@/components/inventory/InventoryItemDetail";
import { MadeWithDyad } from "@/components/made-with-dyad";

const InventoryItemDetailPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <InventoryItemDetail />
      <MadeWithDyad />
    </div>
  );
};

export default InventoryItemDetailPage;