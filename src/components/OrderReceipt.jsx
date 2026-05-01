import React from 'react';

const OrderReceipt = React.forwardRef(({ order, restaurant }, ref) => {
  if (!order) return null;

  const date = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();

  return (
    <div ref={ref} className="p-8 bg-white text-black max-w-md mx-auto font-mono">
      <div className="text-center border-b-2 border-dashed border-gray-400 pb-4 mb-4">
        <h1 className="text-2xl font-bold">{restaurant?.name || 'Restaurant'}</h1>
        <p className="text-xs">{restaurant?.address || ''}</p>
      </div>

      <div className="mb-4 text-sm">
        <div className="flex justify-between mb-1">
          <span>Order #:</span>
          <span className="font-bold">{order.id.slice(0, 8).toUpperCase()}</span>
        </div>
        <div className="flex justify-between mb-1">
          <span>Table:</span>
          <span className="font-bold">{order.tableId}</span>
        </div>
        <div className="flex justify-between mb-1">
          <span>Date:</span>
          <span>{date.toLocaleDateString('en-PK')}</span>
        </div>
        <div className="flex justify-between">
          <span>Time:</span>
          <span>{date.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      <div className="border-t-2 border-dashed border-gray-400 pt-4 mb-4">
        <div className="text-xs font-bold mb-2 flex justify-between">
          <span>ITEM</span>
          <span>TOTAL</span>
        </div>
        {order.items?.map((item, idx) => (
          <div key={idx} className="mb-3 text-sm">
            <div className="flex justify-between">
              <span className="font-semibold">{item.name}</span>
              <span>Rs. {(item.price * (item.quantity || item.qty)).toFixed(0)}</span>
            </div>
            <div className="text-xs text-gray-600">
              {item.quantity || item.qty} x Rs. {item.price}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t-2 border-dashed border-gray-400 pt-4">
        <div className="flex justify-between text-lg font-bold mb-2">
          <span>TOTAL</span>
          <span>Rs. {(order.totalAmount || order.total || 0).toFixed(0)}</span>
        </div>
      </div>

      <div className="text-center text-xs text-gray-600 border-t-2 border-dashed border-gray-400 pt-4">
        <p className="font-bold mb-2">Thank You!</p>
      </div>

      <div style={{ textAlign: 'center', marginTop: '24px', borderTop: '2px dashed #000', paddingTop: '16px' }}>
        <p style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
          RATE YOUR EXPERIENCE
        </p>
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${window.location.origin}/feedback/${order.id}`}
          alt="Feedback QR"
          style={{ width: '120px', height: '120px', margin: '0 auto' }}
        />
        <p style={{ fontSize: '10px', marginTop: '8px' }}>
          Scan to leave feedback ⭐
        </p>
      </div>
    </div>
  );
});

OrderReceipt.displayName = 'OrderReceipt';
export default OrderReceipt;