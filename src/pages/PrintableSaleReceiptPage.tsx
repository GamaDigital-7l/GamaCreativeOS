import { PrintableSaleReceipt } from "@/components/sales/PrintableSaleReceipt";

const PrintableSaleReceiptPage = () => {
  return (
    <div className="bg-white">
      <PrintableSaleReceipt printMode="client_only" paperFormat="a4" />
    </div>
  );
};

export default PrintableSaleReceiptPage;