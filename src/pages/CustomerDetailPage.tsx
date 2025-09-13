import { CustomerDetail } from "@/components/customers/CustomerDetail";
import { MadeWithDyad } from "@/components/made-with-dyad";

const CustomerDetailPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-primary/10 p-4 sm:p-6">
      <CustomerDetail />
      <MadeWithDyad />
    </div>
  );
};

export default CustomerDetailPage;