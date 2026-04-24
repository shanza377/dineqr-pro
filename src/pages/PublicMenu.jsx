import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, onSnapshot, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Plus, Minus, ShoppingCart, X, CheckCircle, Loader2, Utensils } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const PublicMenu = () => {
  const { restaurantId, tableId } = useParams(); 
  const [restaurant, setRestaurant] = useState(null);
  const [table, setTable] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orderPlaced, setOrderPlaced] = useState(false);

  
  useEffect(() => {
    const fetchInfo = async () => {
      try {
        // Restaurant name
        const restRef = doc(db, 'restaurants', restaurantId);
        const restSnap = await getDoc(restRef);
        if (restSnap.exists()) setRestaurant(restSnap.data());

        
        const tableRef = doc(db, 'restaurants', restaurantId, 'tables', tableId);
        const tableSnap = await getDoc(tableRef);
        if (tableSnap.exists()) setTable(tableSnap.data());
      } catch (error) {
        console.error("Error fetching info:", error);
      }
    };
    fetchInfo();
  }, [restaurantId, tableId]);

 
  useEffect(() => {
    if (!restaurantId) return;
    const menuRef = collection(db, 'restaurants', restaurantId, 'menuItems');
    const q = query(menuRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id,...doc.data() }));
      setMenuItems(items);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [restaurantId]);

 
  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id? {...i, qty: i.qty + 1 } : i);
      }
      return [...prev, {...item, qty: 1 }];
    });
    toast.success(`${item.name} added`);
  };

  const updateQty = (itemId, change) => {
    setCart(prev => prev.map(i => {
      if (i.id === itemId) {
        const newQty = i.qty + change;
        return newQty > 0? {...i, qty: newQty } : null;
      }
      return i;
    }).filter(Boolean));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  
  const placeOrder = async () => {
    if (cart.length === 0) return toast.error('Cart is empty');
    try {
      const ordersRef = collection(db, 'restaurants', restaurantId, 'orders');
      await addDoc(ordersRef, {
        tableId: tableId,
        tableName: table?.name || `Table ${table?.tableNumber}`,
        items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
        total: totalAmount,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setOrderPlaced(true);
      setCart([]);
      setShowCart(false);
      toast.success('Order placed successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to place order');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-red-500" /></div>;

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md">
          <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-2">Order Placed!</h2>
          <p className="text-gray-600 mb-6">Your order has been sent. Please wait at {table?.name}.</p>
          <button onClick={() => setOrderPlaced(false)} className="px-6 py-3 bg-red-600 text-white rounded-lg">Order Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />
      <div className="bg-gradient-to-r from-red-500 to-orange-600 text-white p-6 shadow-lg sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{restaurant?.name || 'Restaurant'}</h1>
            <p className="text-red-100">{table?.name}</p>
          </div>
          <button onClick={() => setShowCart(true)} className="relative bg-white text-red-600 p-3 rounded-full">
            <ShoppingCart size={24} />
            {totalItems > 0 && <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">{totalItems}</span>}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 pb-32">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Utensils size={20} /> Menu</h2>
        {menuItems.length === 0? <div className="bg-white p-12 rounded-2xl text-center"><p className="text-gray-500">No items available</p></div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {menuItems.map(item => (
              <div key={item.id} className="bg-white rounded-2xl border overflow-hidden">
                <img src={item.imageUrl || 'https://placehold.co/400x300/e2e8f0/64748b?text=Food'} alt={item.name} className="w-full h-48 object-cover" />
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div><h3 className="font-bold text-lg">{item.name}</h3><p className="text-sm text-gray-500">{item.category}</p></div>
                    <p className="text-xl font-bold text-red-600">Rs. {item.price}</p>
                  </div>
                  <button onClick={() => addToCart(item)} className="w-full mt-3 bg-gray-900 text-white py-2 rounded-lg flex items-center justify-center gap-2"><Plus size={18} /> Add to Cart</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowCart(false)}>
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b flex justify-between items-center"><h2 className="text-2xl font-bold">Your Cart</h2><button onClick={() => setShowCart(false)}><X size={24} /></button></div>
            <div className="p-6 overflow-y-auto" style={{ height: 'calc(100% - 200px)' }}>
              {cart.length === 0? <p className="text-center text-gray-500 py-12">Cart is empty</p> : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex gap-3 border-b pb-4">
                      <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-500">Rs. {item.price}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 border rounded-lg flex items-center justify-center"><Minus size={16} /></button>
                          <span className="font-medium">{item.qty}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 border rounded-lg flex items-center justify-center"><Plus size={16} /></button>
                        </div>
                      </div>
                      <div className="text-right"><p className="font-bold">Rs. {item.price * item.qty}</p></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {cart.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 p-6 border-t bg-white">
                <div className="flex justify-between mb-4 text-lg"><span className="font-medium">Total:</span><span className="font-bold text-2xl">Rs. {totalAmount}</span></div>
                <button onClick={placeOrder} className="w-full bg-red-600 text-white py-3 rounded-lg font-medium text-lg">Place Order</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicMenu;