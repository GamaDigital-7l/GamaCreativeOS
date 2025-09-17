import { CustomerDetail } from "@/components/customers/CustomerDetail";

const CustomerDetailPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-primary/10 p-4 sm:p-6">
      <CustomerDetail />
    </div>
  );
};

export default CustomerDetailPage;