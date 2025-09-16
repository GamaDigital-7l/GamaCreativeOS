import { PrintableSaleReceipt } from "@/components/sales/PrintableSaleReceipt";
import { GamaCreative } from "@/components/gama-creative";

const PrintableSaleReceiptPage = () => {
  return (
    <div className="bg-white">
      <PrintableSaleReceipt />
      <GamaCreative />
    </div>
  );
};

export default PrintableSaleReceiptPage;