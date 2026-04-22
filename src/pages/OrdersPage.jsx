import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase'; 
import { collection, query, where, getDocs, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const AdminOrders = () => {
  const [user, loadingAuth] = useAuthState(auth);
  const [restaurantId, setRestaurantId] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  
  useEffect(() => {
    if (!user) return;

    const fetchRestaurantId = async () => {
      try {
        const q = query(collection(db, 'restaurants'), where('ownerId', '==', user.uid));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          setRestaurantId(snapshot.docs[0].id);
        } else {
          toast.error("Restaurant not found for this user");
          setLoading(false);
        }
      } catch (error) {
        console.error("Restaurant fetch error:", error);
        toast.error("Restaurant doesn't load");
        setLoading(false);
      }
    };

    fetchRestaurantId();
  }, );

  
  useEffect(() => {
    
    if (loadingAuth ||!user ||!restaurantId) return;

    setLoading(true);
    const ordersRef = collection(db, `restaurants/${restaurantId}/orders`);
    const q = query(ordersRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
      ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() 
      }));
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error("Orders listener error:", error);
      toast.error("Orders doesn't load");
      setLoading(false);
    });

    
    return () => unsubscribe();
  }, [user, loadingAuth, restaurantId]);

  
  const updateOrderStatus = async (orderId, newStatus) => {
    if (!restaurantId) return;

    try {
      const orderRef = doc(db, `restaurants/${restaurantId}/orders`, orderId);
      await updateDoc(orderRef, {
        status: newStatus
      });
      toast.success(`Order ${newStatus} kar diya`);
    } catch (error) {
      console.error("Status update error:", error);
      toast.error("Status update nahi hua");
    }
  };

  
  if (loadingAuth) {
    return <div className="p-8 text-center">checking auth...</div>;
  }

  if (!user) {
    return <div className="p-8 text-center">First Login...</div>;
  }

  if (loading) {
    return <div className="p-8 text-center">Loading Orders...</div>;
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">Live Orders</h1>

      {orders.length === 0? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Order not found yet 😊</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white p-4 rounded-lg shadow border">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold">Table: {order.tableName || order.tableId}</p>
                  <p className="text-sm text-gray-500">
                    {order.createdAt? new Date(order.createdAt).toLocaleString() : 'Abhi ka'}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold
                  ${order.status === 'pending'?'bg-yellow-200 text-yellow-800' : ''}
                  ${order.status === 'preparing'?'bg-blue-200 text-blue-800' : ''}
                  ${order.status === 'completed'?'bg-green-200 text-green-800' : ''}
                  ${order.status === 'cancelled'?'bg-red-200 text-red-800' : ''}
                `}>
                  {order.status}
                </span>
              </div>

              <div className="border-t my-3"></div>

              <div className="space-y-1 mb-3">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.name} x {item.quantity}</span>
                    <span>Rs. {item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="border-t my-3"></div>

              <div className="flex justify-between items-center">
                <p className="font-bold">Total: Rs. {order.totalAmount}</p>
                <div className="space-x-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                    >
                      Preparing
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;