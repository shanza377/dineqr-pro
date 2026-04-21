Import React from 'react';
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Plus, Minus, ShoppingCart, X, CheckCircle, Import } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const PublicMenu = () => {
  const { restaurantId } = useParams();
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get('table');

  const [restaurant, setRestaurant] = useState(null);
  const [table, setTable] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Fetch restaurant details from Firestore
  useEffect(() => {
    const fetchRestaurant = async () => {
      if (!restaurantId) return;
      const restRef = doc(db, 'restaurants', restaurantId);
      const restSnap = await getDoc(restRef);
      if (restSnap.exists()) {
        setRestaurant(restSnap.data());
      }
    };
    fetchRestaurant();
  }, [restaurantId]);

  // Fetch table details from Firestore
  useEffect(() => {
    const fetchTable = async () => {
      if (!tableId) return;
      const tableRef = doc(db, 'tables', tableId);
      const tableSnap = await getDoc(tableRef);
      if (tableSnap.exists()) {
        setTable(tableSnap.data());
      }
    };
    fetchTable();
  }, [tableId]);

  // Fetch menu items real-time based on restaurantId
  useEffect(() => {
    if (!restaurantId) return;

    const q = query(
      collection(db, 'menuItems'),
      where('restaurantId', '==', restaurantId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
       ...doc.data()
      }));
      setMenuItems(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [restaurantId]);

  // Add item to cart or increase quantity if already exists
  const addToCart = (item) => {
    setCart(prevCart => {
      const existing = prevCart.find(c => c.id === item.id);
      if (existing) {
        return prevCart.map(c =>
          c.id === item.id? {...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prevCart, {...item, quantity: 1 }];
    });
    toast.success(`${item.name} added to cart`);
  };

  // Update cart item quantity
  const updateQuantity = (itemId, change) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === itemId) {
          const newQty = item.quantity + change;
          return newQty > 0? {...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean); // Remove items with 0 quantity
    });
  };

  // Calculate cart totals
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Place order to Firestore orders collection
  const placeOrder = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    try {
      await addDoc(collection(db, 'orders'), {
        restaurantId: restaurantId,
        tableId: tableId || null,
        tableName: table?.name || 'Takeaway',
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        totalAmount: totalAmount,
        status: 'Pending',
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

  if (loading) {
    return <div className="text-center py-20">Loading menu...</div>;
  }

  // Order success screen
  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md">
          <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-2">Order Placed!</h2>
          <p className="text-gray-600 mb-6">Your order has been sent to the kitchen. Please wait at {table?.name || 'your table'}.</p>
          <button
            onClick={() => setOrderPlaced(false)}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Order Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />

      {/* Header with restaurant name and cart button */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">{restaurant?.name || 'Restaurant'}</h1>
              {table && <p className="text-sm text-gray-500">You are at: {table.name}</p>}
            </div>
            <button
              onClick={() => setShowCart(true)}
              className="relative bg-red-600 text-white p-3 rounded-full hover:bg-red-700"
            >
              <ShoppingCart size={24} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {menuItems.length === 0? (
          <div className="bg-white p-12 rounded-2xl text-center">
            <p className="text-gray-500">No items available right now</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {menuItems.map(item => (
              <div key={item.id} className="bg-white rounded-2xl border overflow-hidden">
                {item.imageUrl && (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-48 object-cover" />
                )}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg">{item.name}</h3>
                      <p className="text-sm text-gray-500">{item.category}</p>
                    </div>
                    <p className="text-xl font-bold text-red-600">Rs. {item.price}</p>
                  </div>
                  <button
                    onClick={() => addToCart(item)}
                    className="w-full mt-3 bg-gray-900 text-white py-2 rounded-lg hover:bg-black flex items-center justify-center gap-2"
                  >
                    <Plus size={18} />
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowCart(false)}>
          <div
            className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold">Your Cart</h2>
              <button onClick={() => setShowCart(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto" style={{ height: 'calc(100% - 200px)' }}>
              {cart.length === 0? (
                <p className="text-center text-gray-500 py-12">Cart is empty</p>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex gap-3 border-b pb-4">
                      <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-500">Rs. {item.price}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-8 h-8 border rounded-lg flex items-center justify-center hover:bg-gray-50"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-8 h-8 border rounded-lg flex items-center justify-center hover:bg-gray-50"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">Rs. {item.price * item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 p-6 border-t bg-white">
                <div className="flex justify-between mb-4 text-lg">
                  <span className="font-medium">Total:</span>
                  <span className="font-bold text-2xl">Rs. {totalAmount}</span>
                </div>
                <button
                  onClick={placeOrder}
                  className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 font-medium text-lg"
                >
                  Place Order
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicMenu;