import React from 'react';

const KitchenReceipt = React.forwardRef(({ order }, ref) => {
  if (!order) return null;
  const date = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();

  return (
    <div ref={ref} style={{ padding: '16px', fontFamily: 'monospace', width: '72mm', color: '#000' }}>
      <div style={{ textAlign: 'center', borderBottom: '3px solid #000', paddingBottom: '12px', marginBottom: '12px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '900', margin: '0' }}>KITCHEN</h1>
        <p style={{ fontSize: '24px', fontWeight: '900', margin: '8px 0 0 0' }}>TABLE {order.tableId}</p>
      </div>

      <div style={{ marginBottom: '16px', fontSize: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span>Order:</span>
          <span style={{ fontWeight: '900', fontSize: '20px' }}>{order.id.slice(0, 8).toUpperCase()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Time:</span>
          <span style={{ fontWeight: '900' }}>{date.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      <div style={{ borderTop: '3px solid #000', borderBottom: '3px solid #000', padding: '16px 0' }}>
        {order.items?.map((item, idx) => (
          <div key={idx} style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '22px', fontWeight: '900' }}>
              {item.quantity || item.qty}x {item.name}
            </div>
            {item.notes && (
              <div style={{ fontSize: '16px', marginTop: '4px', paddingLeft: '8px', fontWeight: '700' }}>
                ** {item.notes}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '18px', fontWeight: '900', textTransform: 'uppercase' }}>
        {order.status}
      </div>
    </div>
  );
});

KitchenReceipt.displayName = 'KitchenReceipt';
export default KitchenReceipt;