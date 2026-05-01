import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Clock, CookingPot, CheckCircle, ChevronRight, ArrowLeft } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function MyOrders() {
  const { restaurantId, tableId } = useParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tableId || !restaurantId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'orders'),
      where('restaurantId', '==', restaurantId), 
      where('tableId', '==', tableId),
      where('status', 'in', ['pending', 'preparing']),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
       ...doc.data()
      }));
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error('Firebase error:', error);
      toast.error('Failed to load orders. Create Firebase index if needed.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [restaurantId, tableId]); 

  if (!restaurantId || !tableId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50 p-6">
        <div className="text-center bg-white rounded-2xl shadow-lg p-8">
          <p className="text-red-500 font-bold text-lg">Invalid URL</p>
          <p className="text-sm text-gray-600 mt-2">Restaurant ID or Table ID missing</p>
          <Link to="/" className="text-blue-500 underline mt-4 inline-block">Go Home</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 p-6">
      <Toaster position="top-center" />
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <Link
            to={`/menu/${restaurantId}/${tableId}`}  
            className="flex items-center gap-2 text-gray-600 mb-4 hover:text-orange-500"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back to Menu</span>
          </Link>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
            <p className="text-sm text-gray-500 mt-1">Table: {tableId}</p>
            <p className="text-xs text-gray-400 mt-2">{orders.length} Active Orders</p>
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium mb-2">No active orders 😊</p>
            <p className="text-sm text-gray-400 mb-4">Order something delicious!</p>
            <Link
              to={`/menu/${restaurantId}/${tableId}`}  
              className="inline-block bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
            >
              Order Now
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                to={`/track/${order.id}`}
                className="block bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all hover:scale-[1.02]"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm text-gray-500">Order #{order.id.slice(0, 6)}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {order.createdAt?.toDate
                       ? order.createdAt.toDate().toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Just now'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      order.status === 'pending'
                       ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status === 'pending'? 'Placed' : 'Preparing'}
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-gray-600">
                      {order.items?.length || 0} {order.items?.length === 1? 'item' : 'items'}
                    </p>
                    <p className="text-xl font-bold text-orange-600">
                      Rs. {order.totalAmount || order.total || 0}
                    </p>
                  </div>

                  {/* Items Preview */}
                  <div className="text-xs text-gray-500">
                    {order.items?.slice(0, 2).map((item, idx) => (
                      <span key={idx}>
                        {item.name} x{item.quantity || item.qty}
                        {idx < Math.min(order.items.length, 2) - 1? ', ' : ''}
                      </span>
                    ))}
                    {order.items?.length > 2 && <span> +{order.items.length - 2} more</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                  {order.status === 'pending' && (
                    <>
                      <Clock className="w-4 h-4 text-yellow-500" />
                      <span className="text-xs text-gray-600">Order placed, waiting for confirmation</span>
                    </>
                  )}
                  {order.status === 'preparing' && (
                    <>
                      <CookingPot className="w-4 h-4 text-blue-500 animate-pulse" />
                      <span className="text-xs text-gray-600">Kitchen is preparing your order</span>
                    </>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {orders.length > 0 && (
          <Link
            to={`/menu/${restaurantId}/${tableId}`} 
            className="block w-full bg-orange-500 text-white py-4 rounded-2xl font-bold text-center mt-6 hover:bg-orange-600 transition-colors shadow-lg"
          >
            + Add More Items
          </Link>
        )}
      </div>
    </div>
  );
}