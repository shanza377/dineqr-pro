import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { CheckCircle, Clock, ChefHat, Bell } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Real-time listener for orders collection
    // Order by newest first
    const q = query(
      collection(db, 'orders'),
      where('restaurantId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, ); // Add user.uid dependency

  // Update order status: Pending -> Preparing -> Completed
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus
      });
      toast.success(`Order marked as ${newStatus}`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update order status');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Preparing': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Pending': return <Bell size={16} />;
      case 'Preparing': return <ChefHat size={16} />;
      case 'Completed': return <CheckCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  if (loading) {
    return <div className="text-center py-20">Loading orders...</div>;
  }

  return (
    <div>
      <Toaster position="top-right" />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Live Orders</h1>
        <div className="text-sm text-gray-500">
          {orders.filter(o => o.status === 'Pending').length} Pending orders
        </div>
      </div>

      {orders.length === 0? (
        <div className="bg-white p-12 rounded-2xl border text-center">
          <ChefHat size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">No orders yet</p>
          <p className="text-gray-400 text-sm mt-2">Orders will appear here when customers place them</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl border p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-xl">Order #{order.id.slice(-6).toUpperCase()}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Table: {order.tableName} • {order.createdAt?.toDate().toLocaleTimeString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">Rs. {order.totalAmount}</p>
                  <p className="text-xs text-gray-500">{order.items.length} items</p>
                </div>
              </div>

              {/* Order Items List */}
              <div className="border-t border-b py-3 mb-4 space-y-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.name}</span>
                    <span className="text-gray-600">Rs. {item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end">
                {order.status === 'Pending' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'Preparing')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <ChefHat size={18} />
                    Start Preparing
                  </button>
                )}
                {order.status === 'Preparing' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'Completed')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <CheckCircle size={18} />
                    Mark Completed
                  </button>
                )}
                {order.status === 'Completed' && (
                  <span className="px-4 py-2 text-green-700 font-medium flex items-center gap-2">
                    <CheckCircle size={18} />
                    Completed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;