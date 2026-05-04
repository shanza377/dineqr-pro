import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Clock, CheckCircle, CookingPot, UtensilsCrossed, Volume2, Clock3, History, Printer } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useReactToPrint } from 'react-to-print'; 
import KitchenReceipt from '../components/KitchenReceipt'; 

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const audioRef = useRef(null);
  const prevOrdersCount = useRef(0);
  const [activeTab, setActiveTab] = useState('live');
  const [historyOrders, setHistoryOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const kitchenReceiptRef = useRef();

  const handleKitchenPrint = useReactToPrint({
    contentRef: kitchenReceiptRef,
    documentTitle: `Kitchen-${selectedOrder?.id.slice(0, 6)}`,
    onAfterPrint: () => {
      toast.success('Kitchen copy printed! 🍳');
      setSelectedOrder(null);
    },
    onPrintError: () => {
      toast.error('Print failed');
      setSelectedOrder(null);
    }
  });

  const printKitchenCopy = (order) => {
    setSelectedOrder(order);
    setTimeout(() => handleKitchenPrint(), 100);
  };

  useEffect(() => {
    if (!currentUser?.uid || activeTab !== 'history') return;

    const q = query(
      collection(db, 'orders'),
      where('restaurantId', '==', currentUser.uid),
      where('status', '==', 'completed'),
      orderBy('createdAt', 'desc'),
      limit(50) 
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHistoryOrders(ordersData);
    });

    return () => unsubscribe();
  }, [currentUser, activeTab]);

  useEffect(() => {
    audioRef.current = new Audio('/notification.mp3');
    audioRef.current.volume = 0.7;
    audioRef.current.load();

    const unlockAudio = () => {
      audioRef.current?.play().then(() => {
        audioRef.current?.pause();
        audioRef.current.currentTime = 0;
        console.log('Audio unlocked');
      }).catch(() => {});
      document.removeEventListener('click', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);

    return () => document.removeEventListener('click', unlockAudio);
  }, []);

  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    let isInitialLoad = true;

    const q = query(
      collection(db, 'orders'),
      where('restaurantId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log('Orders fetched:', ordersData.length, 'Previous:', prevOrdersCount.current);

      if (!isInitialLoad && ordersData.length > prevOrdersCount.current) {
        console.log('🔔 New order detected! Playing sound...');

        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play()
            .then(() => console.log('Sound played successfully'))
            .catch(e => {
              console.log('Audio blocked:', e);
              toast.error('Click anywhere to enable sound');
            });
        }

        toast.success('🔔 New order received!', {
          duration: 5000,
          icon: '🔥'
        });
      }

      if (isInitialLoad) {
        isInitialLoad = false;
      }

      prevOrdersCount.current = ordersData.length;
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error('Orders fetch error:', error);
      toast.error('Failed to load orders');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: new Date()
      });
      toast.success(`Order ${newStatus}`);
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update status');
    }
  };

  const testSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play()
        .then(() => toast.success('Sound working! 🔊'))
        .catch(e => toast.error('Sound blocked: ' + e.message));
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const liveOrders = orders.filter(o => o.status !== 'completed');

  return (
    <div className="p-6">
      <Toaster position="top-center" />
      
      {/* 👇 HIDDEN KITCHEN RECEIPT */}
      {selectedOrder && (
        <div style={{ display: 'none' }}>
          <KitchenReceipt ref={kitchenReceiptRef} order={selectedOrder} />
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Orders</h2>
      </div>

      {/* TABS */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('live')}
          className={`px-6 py-3 font-semibold flex items-center gap-2 ${
            activeTab === 'live'
              ? 'border-b-2 border-orange-500 text-orange-600' 
              : 'text-gray-500'
          }`}
        >
          <Clock3 className="w-4 h-4" /> Live Orders ({liveOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 font-semibold flex items-center gap-2 ${
            activeTab === 'history'
              ? 'border-b-2 border-orange-500 text-orange-600' 
              : 'text-gray-500'
          }`}
        >
          <History className="w-4 h-4" /> Order History
        </button>
      </div>

      {/* LIVE ORDERS TAB */}
      {activeTab === 'live' && (
        <>
          {liveOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <UtensilsCrossed className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No active orders 😊</p>
              <p className="text-sm mt-2">Customer jab order kare ga to yahan show hoga</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {liveOrders.map((order) => ( 
                <div key={order.id} className={`bg-white rounded-xl border-2 p-6 shadow-sm transition-all ${
                  order.status === 'pending' ? 'border-yellow-400 animate-pulse' :
                  order.status === 'preparing' ? 'border-blue-400' :
                  'border-green-400'
                }`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        Table: <span className="font-bold">{order.tableId || order.tableNumber}</span>
                      </p>
                      <p className="text-2xl font-bold text-orange-600">Rs. {order.totalAmount || order.total}</p>
                      <p className="text-xs text-gray-400">
                        {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : 'Just now'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4 border-t pt-4">
                    <p className="font-semibold text-sm text-gray-700">Items:</p>
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{item.name} x {item.quantity || item.qty}</span>
                        <span>Rs. {item.price * (item.quantity || item.qty)}</span>
                      </div>
                    ))}
                  </div>

                  {/* 👇 BUTTONS ROW WITH KITCHEN PRINT */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => printKitchenCopy(order)}
                      className="bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
                    >
                      <Printer className="w-4 h-4" /> Kitchen
                    </button>

                    {order.status === 'pending' && (
                      <button
                        onClick={() => updateStatus(order.id, 'preparing')}
                        className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors"
                      >
                        <CookingPot className="w-4 h-4" /> Start Preparing
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button
                        onClick={() => updateStatus(order.id, 'completed')}
                        className="flex-1 bg-green-500 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-green-600 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" /> Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
        <>
          {historyOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <History className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No completed orders yet</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {historyOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500">Order #{order.id.slice(0, 6)}</p>
                      <p className="text-sm text-gray-500">Table: {order.tableId || order.tableNumber}</p>
                      <p className="text-xs text-gray-400">
                        {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-600 mb-2">Rs. {order.totalAmount || order.total}</p>
                      <div className="flex gap-2 justify-end">
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Completed ✓
                        </span>
                        <button
                          onClick={() => printKitchenCopy(order)}
                          className="bg-gray-700 text-white px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-gray-800"
                        >
                          <Printer className="w-3 h-3" /> Reprint
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}