import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { ShoppingCart, Plus, Minus, UtensilsCrossed, X, ClipboardList, Bell } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function PublicMenu() {
  const navigate = useNavigate();
  const { restaurantId, tableId } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [lastOrderId, setLastOrderId] = useState(null);

  useEffect(() => {
    if (tableId) {
      const savedOrderId = localStorage.getItem(`lastOrder_${tableId}`);
      setLastOrderId(savedOrderId);
      localStorage.setItem('currentTableId', tableId);
    }
  }, [tableId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const restaurantDoc = await getDoc(doc(db, 'restaurants', restaurantId));
        if (restaurantDoc.exists()) {
          setRestaurant(restaurantDoc.data());
        }

        const menuSnapshot = await getDocs(collection(db, 'restaurants', restaurantId, 'menuItems'));
        const items = menuSnapshot.docs.map(doc => ({ id: doc.id,...doc.data() }));
        setMenuItems(items);
      } catch (error) {
        console.error('Fetch error:', error);
        toast.error("Failed to load menu");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [restaurantId]);

  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    setPlacing(true);

    try {
      const docRef = await addDoc(collection(db, 'orders'), {
        restaurantId: restaurantId, // ✅ YE BILKUL SAHI HAI
        tableId: tableId,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.qty,
          imageUrl: item.imageUrl || item.image || ''
        })),
        totalAmount: totalPrice,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      localStorage.setItem(`lastOrder_${tableId}`, docRef.id);

      toast.success('Order placed successfully! Redirecting...');
      setCart([]);
      setShowCart(false);

      setTimeout(() => {
        navigate(`/track/${docRef.id}`);
      }, 1000);

    } catch (error) {
      console.error("Error placing order:", error);
      toast.error('Failed to place order: ' + error.message);
    }

    setPlacing(false);
  };

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id? {...i, qty: i.qty + 1 } : i);
      }
      return [...prev, {...item, qty: 1 }];
    });
    toast.success(`${item.name} added to cart`);
  };

  const updateQty = (itemId, change) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === itemId) {
          const newQty = item.qty + change;
          return newQty > 0? {...item, qty: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />

      {/* TOP BAR - ACTIVE ORDER BANNER */}
      {lastOrderId && (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-3 sticky top-0 z-50 shadow-lg">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 animate-pulse" />
              <span className="text-sm font-bold">You have an active order</span>
            </div>
            <Link
              to={`/track/${lastOrderId}`}
              className="bg-white text-orange-500 px-4 py-1.5 rounded-full text-sm font-bold hover:bg-orange-50"
            >
              Track Now →
            </Link>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="bg-red-600 text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {restaurant?.logoUrl? (
              <img
                src={restaurant.logoUrl}
                alt="Logo"
                className="w-10 h-10 object-contain rounded-xl bg-white p-1 flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <UtensilsCrossed className="w-6 h-6 text-white" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold leading-tight line-clamp-2">
                {restaurant?.name || 'Restaurant'}
              </h1>
              {tableId && <p className="text-xs text-white/80">Table: {tableId}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 👇 MY ORDERS BUTTON - THEEK KAR DIYA */}
            {tableId && (
              <Link
                to={`/my-orders/${restaurantId}/${tableId}`} // ✅ FIXED
                className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition"
              >
                <ClipboardList className="w-6 h-6" />
              </Link>
            )}

            <button
              onClick={() => setShowCart(true)}
              className="relative p-3 bg-white/20 hover:bg-white/30 rounded-xl transition flex-shrink-0 cursor-pointer"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-red-600 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MENU ITEMS */}
      <div className="max-w-6xl mx-auto p-4 pb-28">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <UtensilsCrossed className="w-6 h-6 text-red-600" />
          Menu
        </h2>

        {menuItems.length === 0? (
          <div className="text-center py-12 text-gray-500">
            <UtensilsCrossed className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>No menu items available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition">
                {item.imageUrl || item.image? (
                  <img
                    src={item.imageUrl || item.image}
                    alt={item.name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">No Image</span>
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-lg">{item.name}</h3>
                      <p className="text-sm text-gray-500">{item.category}</p>
                    </div>
                    <p className="text-xl font-bold text-red-600 ml-2">Rs. {item.price}</p>
                  </div>
                  <button
                    onClick={() => addToCart(item)}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-5 h-5" /> Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FLOATING TRACK BUTTON - Bottom Right */}
      {lastOrderId && (
        <Link
          to={`/track/${lastOrderId}`}
          className="fixed bottom-24 right-4 bg-blue-500 text-white p-4 rounded-full shadow-2xl hover:bg-blue-600 z-50 hover:scale-110 transition-all"
        >
          <ClipboardList className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
            1
          </span>
        </Link>
      )}

      {/* CART MODAL */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center">
          <div className="bg-white w-full md:max-w-lg md:rounded-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">Your Order</h3>
              <button onClick={() => setShowCart(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {cart.length === 0? (
                <p className="text-center text-gray-500 py-8">Cart is empty</p>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">Rs. {item.price}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center cursor-pointer"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-bold w-8 text-center">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-lg font-semibold">Total Amount</p>
                  <p className="text-2xl font-bold text-red-600">Rs. {totalPrice}</p>
                </div>
                <button
                 onClick={handlePlaceOrder}
                 disabled={placing}
                 className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold disabled:opacity-50 hover:bg-orange-600 transition"
                >
                 {placing? 'Placing...' : 'Place Order'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {cart.length > 0 &&!showCart && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{cartCount} items</p>
              <p className="text-xl font-bold">Total: Rs. {totalPrice}</p>
            </div>
            <button
             onClick={() => setShowCart(true)}
             className="bg-orange-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-600 transition"
            >
             View Cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
}