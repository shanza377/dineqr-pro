import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Bell, Clock, CookingPot, CheckCircle, ChevronRight, ArrowLeft, PackageCheck, Printer, X } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useReactToPrint } from 'react-to-print';
import OrderReceipt from '../components/OrderReceipt';

export default function OrderTracking() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const receiptRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Receipt-${order?.id.slice(0, 6) || 'order'}`,
    onBeforePrint: async () => {
      if (!order) {
        toast.error('Order not loaded yet!');
        return Promise.reject();
      }
      return Promise.resolve();
    },
    onAfterPrint: () => toast.success('Receipt printed! 🖨️'),
    onPrintError: (error) => {
      console.error('Print error:', error);
      toast.error('Failed to print');
    }
  });

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'orders', orderId), async (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        setOrder(data);
        console.log('Order status updated:', data.status);

        if (data.restaurantId && !restaurant) {
          const restDoc = await getDoc(doc(db, 'restaurants', data.restaurantId));
          if (restDoc.exists()) setRestaurant(restDoc.data());
        }
      } else {
        toast.error('Order not found');
        setOrder(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [orderId]);

  const getStatusStep = () => {
    switch (order?.status) {
      case 'pending': return 1;
      case 'preparing': return 2;
      case 'ready': return 3;
      case 'served': return 4;
      case 'completed': return 4;
      case 'cancelled': return 0;
      default: return 1;
    }
  };

  const currentStep = getStatusStep();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center bg-white rounded-2xl shadow-lg p-8">
          <p className="text-red-500 font-bold text-lg">Order Not Found</p>
          <Link to="/" className="text-blue-500 underline mt-4 inline-block">Go Home</Link>
        </div>
      </div>
    );
  }

  if (order.status === 'cancelled') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-6">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Cancelled</h1>
            <p className="text-sm text-gray-500">Order #{order.id.slice(0, 6)}</p>
            <Link
              to={`/menu/${order.restaurantId}/${order.tableId}`}
              className="inline-block bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold mt-6 hover:bg-orange-600"
            >
              Order Again
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 p-6">
      <Toaster position="top-center" />

      {order && (
        <div style={{ display: 'none' }}>
          <OrderReceipt ref={receiptRef} order={order} restaurant={restaurant} />
        </div>
      )}

      <div className="max-w-md mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 mb-4 hover:text-orange-500"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 text-center">
          <Bell className="w-12 h-12 text-orange-500 mx-auto mb-3 animate-pulse" />
          <h1 className="text-2xl font-bold text-gray-900">Track Your Order</h1>
          <p className="text-sm text-gray-500 mt-1">Order #{order.id.slice(0, 6)}</p>
          <p className="text-xs text-gray-400 mt-1">Table: {order.tableId}</p>

          <div className="flex gap-2 justify-center mt-3">
            <Link
              to={`/my-orders/${order.restaurantId}/${order.tableId}`}
              className="text-blue-500 text-sm inline-flex items-center gap-1 hover:underline font-medium"
            >
              View All Orders
              <ChevronRight className="w-4 h-4" />
            </Link>

            <button
              onClick={handlePrint}
              disabled={!order}
              className="text-orange-500 text-sm inline-flex items-center gap-1 hover:underline font-medium disabled:text-gray-400 disabled:no-underline"
            >
              <Printer className="w-4 h-4" />
              Print Receipt
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="font-bold text-lg mb-6 text-gray-900">Order Status</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                currentStep >= 1? 'bg-green-500' : 'bg-gray-200'
              }`}>
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Order Placed</p>
                <p className="text-xs text-gray-500 mt-1">We received your order</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                currentStep >= 2? 'bg-blue-500' : 'bg-gray-200'
              }`}>
                <CookingPot className={`w-6 h-6 text-white ${currentStep === 2? 'animate-pulse' : ''}`} />
              </div>
              <div className="flex-1">
                <p className={`font-semibold ${currentStep >= 2? 'text-gray-900' : 'text-gray-400'}`}>Preparing</p>
                <p className="text-xs text-gray-500 mt-1">
                  {currentStep >= 2? 'Kitchen is preparing your order' : 'Waiting...'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                currentStep >= 3? 'bg-orange-500' : 'bg-gray-200'
              }`}>
                <Bell className={`w-6 h-6 text-white ${currentStep === 3? 'animate-bounce' : ''}`} />
              </div>
              <div className="flex-1">
                <p className={`font-semibold ${currentStep >= 3? 'text-gray-900' : 'text-gray-400'}`}>Ready to Serve</p>
                <p className="text-xs text-gray-500 mt-1">
                  {currentStep >= 3? 'Your order is ready!' : 'Waiting...'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                currentStep >= 4? 'bg-purple-500' : 'bg-gray-200'
              }`}>
                <PackageCheck className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className={`font-semibold ${currentStep >= 4? 'text-gray-900' : 'text-gray-400'}`}>Served</p>
                <p className="text-xs text-gray-500 mt-1">
                  {currentStep >= 4? 'Enjoy your meal! 🎉' : 'Waiting...'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="font-bold text-lg mb-4 text-gray-900">Order Details</h2>
          <div className="space-y-3">
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">Qty: {item.quantity || item.qty}</p>
                </div>
                <p className="font-semibold text-gray-900">
                  Rs. {(item.price * (item.quantity || item.qty)).toFixed(0)}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900">Total Amount</span>
            <span className="text-2xl font-bold text-orange-600">
              Rs. {order.totalAmount || order.total || 0}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link
            to={`/menu/${order.restaurantId}/${order.tableId}`}
            className="bg-orange-500 text-white py-4 rounded-2xl font-bold text-center hover:bg-orange-600 transition-colors shadow-lg"
          >
            + Order More
          </Link>
          <button
            onClick={handlePrint}
            disabled={!order}
            className="bg-gray-800 text-white py-4 rounded-2xl font-bold text-center hover:bg-gray-900 transition-colors shadow-lg flex items-center justify-center gap-2 disabled:bg-gray-400"
          >
            <Printer className="w-5 h-5" />
            Print
          </button>
        </div>

      </div>
    </div>
  );
}