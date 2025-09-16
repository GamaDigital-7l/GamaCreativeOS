import { CustomerDetail } from "@/components/customers/CustomerDetail";
import { GamaLogo } from "@/components/GamaLogo"; // Updated import

const CustomerDetailPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-primary/10 p-4 sm:p-6">
      <CustomerDetail />
      <GamaLogo /> {/* Using the new GamaLogo component */}
    </div>
  );
};

export default CustomerDetailPage;