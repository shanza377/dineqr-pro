import React from 'react';
import { Link } from 'react-router-dom';

const DemoDashboard = () => {
  // all data is hardcoded for demo purposes
  const stats = { totalOrders: 47, revenue: 23400, menuItems: 12, tables: 8 };
  const demoItems = [
    { name: "Zinger Burger", price: 550, orders: 23 },
    { name: "Margherita Pizza", price: 1200, orders: 18 },
    { name: "Fries", price: 250, orders: 31 },
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="bg-yellow-100 border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-6">
        <strong>DEMO MODE:</strong> Ye preview hai. Apna data dekhne ke liye <Link to="/login" className="underline font-bold">Sign Up karein</Link>
      </div>

      <h1 className="text-3xl font-bold mb-6">Dashboard Overview</h1>
      
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-500">Total Orders</p>
          <p className="text-2xl font-bold">{stats.totalOrders}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-500">Revenue</p>
          <p className="text-2xl font-bold">Rs. {stats.revenue}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-500">Menu Items</p>
          <p className="text-2xl font-bold">{stats.menuItems}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-500">Tables</p>
          <p className="text-2xl font-bold">{stats.tables}</p>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4">Top Selling Items</h2>
      <div className="bg-white rounded shadow p-4">
        {demoItems.map(item => (
          <div key={item.name} className="flex justify-between py-2 border-b">
            <span>{item.name} - Rs. {item.price}</span>
            <span className="text-gray-500">{item.orders} orders</span>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link to="/login" className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold">
          Start Free Trial - Sign Up Now
        </Link>
      </div>
    </div>
  );
};

export default DemoDashboard;