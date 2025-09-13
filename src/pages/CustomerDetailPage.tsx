import { CustomerDetail } from "@/components/customers/CustomerDetail";
import { MadeWithDyad } from "@/components/made-with-dyad";

const CustomerDetailPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <CustomerDetail />
      <MadeWithDyad />
    </div>
  );
};

export default CustomerDetailPage;