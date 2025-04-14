
import MainLayout from '@/components/layout/MainLayout';
import OrderForm from '@/components/order/OrderForm';

const NewOrder = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Create New Order</h1>
        <OrderForm />
      </div>
    </MainLayout>
  );
};

export default NewOrder;
