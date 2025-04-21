import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData, FOOD_CATEGORIES } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MenuItem, OrderItem, Order, Customer } from '@/types';
import { MinusCircle, PlusCircle, Printer, Receipt, ShoppingCart, Trash2, Loader2 } from 'lucide-react';

const OrderForm = () => {
  const { menuItems, createOrder } = useData();
  const navigate = useNavigate();
  
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Only use the fixed allowed categories for UI tabs/filters
  const categories = ['All', ...FOOD_CATEGORIES];
  
  // Only show/filter menu items based on the allowed categories (if category is not "All")
  const filteredItems = activeCategory === 'All'
    ? menuItems.filter(item => FOOD_CATEGORIES.includes(item.category))
    : menuItems.filter(item => item.category === activeCategory);
  
  const handleAddToCart = (item: MenuItem) => {
    const existingItem = cart.find(cartItem => cartItem.menuItemId === item.id);
    
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.menuItemId === item.id 
          ? { 
              ...cartItem, 
              quantity: cartItem.quantity + 1,
              subtotal: (cartItem.quantity + 1) * cartItem.price
            } 
          : cartItem
      ));
    } else {
      setCart([
        ...cart, 
        {
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          subtotal: item.price
        }
      ]);
    }
  };
  
  const handleRemoveFromCart = (itemId: string) => {
    const existingItem = cart.find(item => item.menuItemId === itemId);
    
    if (existingItem && existingItem.quantity > 1) {
      setCart(cart.map(item => 
        item.menuItemId === itemId 
          ? { 
              ...item, 
              quantity: item.quantity - 1,
              subtotal: (item.quantity - 1) * item.price
            } 
          : item
      ));
    } else {
      setCart(cart.filter(item => item.menuItemId !== itemId));
    }
  };
  
  const handleDeleteFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.menuItemId !== itemId));
  };
  
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.subtotal, 0);
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let customer: Customer | undefined;
      if (customerName.trim()) {
        customer = {
          name: customerName.trim(),
          contact: customerContact.trim()
        };
      }
      
      const newOrder: Omit<Order, 'id' | 'timestamp'> = {
        items: [...cart],
        totalAmount: calculateTotal(),
        status: 'pending',
        customer
      };
      
      const createdOrder = await createOrder(newOrder);
      
      if (createdOrder) {
        setCurrentOrder(createdOrder);
        setShowReceipt(true);
      }
    } catch (error) {
      console.error('Error creating order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handlePrintReceipt = () => {
    window.print();
  };
  
  const handleNewOrder = () => {
    setCart([]);
    setCustomerName('');
    setCustomerContact('');
    setShowReceipt(false);
    setCurrentOrder(null);
  };

  if (showReceipt && currentOrder) {
    return (
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg print:shadow-none">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-brand-orange">Swift Bites</h2>
          <p className="text-sm text-gray-500">123 Food Street, Foodville</p>
          <p className="text-sm text-gray-500">Tel: (123) 456-7890</p>
        </div>
        
        <div className="mb-4 pb-2 border-b">
          <div className="flex justify-between text-sm">
            <span>Order #:</span>
            <span className="font-medium">{currentOrder.id}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Date:</span>
            <span>{new Date(currentOrder.timestamp).toLocaleString()}</span>
          </div>
          {currentOrder.customer && (
            <>
              <div className="flex justify-between text-sm">
                <span>Customer:</span>
                <span>{currentOrder.customer.name}</span>
              </div>
              {currentOrder.customer.contact && (
                <div className="flex justify-between text-sm">
                  <span>Contact:</span>
                  <span>{currentOrder.customer.contact}</span>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="mb-4">
          <h3 className="font-medium mb-2">Order Details</h3>
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr className="text-left">
                <th className="pb-1">Item</th>
                <th className="pb-1 text-center">Qty</th>
                <th className="pb-1 text-right">Price</th>
                <th className="pb-1 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {currentOrder.items.map((item, index) => (
                <tr key={index} className="border-b border-dashed">
                  <td className="py-1">{item.name}</td>
                  <td className="py-1 text-center">{item.quantity}</td>
                  <td className="py-1 text-right">₹{item.price.toFixed(2)}</td>
                  <td className="py-1 text-right">₹{item.subtotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mb-6 text-right">
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>₹{currentOrder.totalAmount.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="text-center text-sm mb-6">
          <p>Thank you for your order!</p>
          <p>Please come again</p>
        </div>
        
        <div className="mt-8 flex space-x-4 print:hidden">
          <Button 
            onClick={handlePrintReceipt}
            className="flex-1"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Receipt
          </Button>
          <Button 
            onClick={handleNewOrder}
            variant="outline"
            className="flex-1"
          >
            New Order
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="flex-1">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Menu</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="All" value={activeCategory} onValueChange={setActiveCategory}>
              <TabsList className="mb-4 flex flex-wrap h-auto">
                {categories.map(category => (
                  <TabsTrigger key={category} value={category}>
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value={activeCategory} className="m-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredItems.map(item => (
                    <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <div className="flex">
                        <div className="w-24 h-24 overflow-hidden">
                          <img 
                            src={item.imageUrl} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://placehold.co/300x300?text=Image+Not+Found';
                            }}
                          />
                        </div>
                        <div className="flex-1 p-3">
                          <div className="flex justify-between">
                            <h3 className="font-medium line-clamp-1">{item.name}</h3>
                            <span className="font-bold">₹{item.price.toFixed(2)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.description}</p>
                          <Button 
                            size="sm" 
                            className="w-full bg-brand-orange hover:bg-brand-orange/90"
                            onClick={() => handleAddToCart(item)}
                          >
                            Add to Order
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      <div className="md:w-96">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="customerName">Customer Name (Optional)</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer name"
                />
              </div>
              <div>
                <Label htmlFor="customerContact">Contact Info (Optional)</Label>
                <Input
                  id="customerContact"
                  value={customerContact}
                  onChange={(e) => setCustomerContact(e.target.value)}
                  placeholder="Phone or email"
                />
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="font-medium mb-2">Items</h3>
              {cart.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No items added yet
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.menuItemId} className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleRemoveFromCart(item.menuItemId)}
                        >
                          <MinusCircle className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <span className="mx-2 w-6 text-center">{item.quantity}</span>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleAddToCart(menuItems.find(mi => mi.id === item.menuItemId)!)}
                        >
                          <PlusCircle className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                      <div className="flex-1 mx-2">
                        <div className="text-sm font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground">₹{item.price.toFixed(2)} each</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">₹{item.subtotal.toFixed(2)}</div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-6 w-6 text-red-500"
                          onClick={() => handleDeleteFromCart(item.menuItemId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-4 pt-2 border-t">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₹{calculateTotal().toFixed(2)}</span>
                </div>
              </div>
              
              <Button 
                className="w-full mt-6 bg-brand-orange hover:bg-brand-orange/90"
                onClick={handlePlaceOrder}
                disabled={cart.length === 0 || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Receipt className="h-4 w-4 mr-2" />
                    Place Order & Generate Receipt
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderForm;
