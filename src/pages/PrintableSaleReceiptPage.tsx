import { PrintableSaleReceipt } from "@/components/sales/PrintableSaleReceipt";
import { GamaLogo } from "@/components/GamaLogo"; // Updated import

const PrintableSaleReceiptPage = () => {
  return (
    <div className="bg-white">
      <PrintableSaleReceipt />
      <GamaLogo /> {/* Using the new GamaLogo component */}
    </div>
  );
};

export default PrintableSaleReceiptPage;