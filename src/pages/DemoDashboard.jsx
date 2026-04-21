import React from 'react';
import { Link } from 'react-router-dom';

const DemoDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-yellow-200 border-l-4 border-yellow-600 text-yellow-900 p-4 mb-6 rounded">
          <p className="font-bold">DEMO MODE ACTIVE</p>
          <p>Live preview of DineQR Pro <Link to="/login" className="underline font-bold">Sign Up karein</Link></p>
        </div>

        <h1 className="text-3xl font-bold mb-6">Restaurant Dashboard - Demo</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-500">Today Orders</p>
            <p className="text-3xl font-bold">47</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-500">Today Sale</p>
            <p className="text-3xl font-bold">Rs. 23,400</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-500">Menu Items</p>
            <p className="text-3xl font-bold">12</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-500">Active Tables</p>
            <p className="text-3xl font-bold">8</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="flex gap-4">
            <button disabled className="bg-red-200 text-red-800 px-4 py-2 rounded cursor-not-allowed">Add Menu Item</button>
            <button disabled className="bg-blue-200 text-blue-800 px-4 py-2 rounded cursor-not-allowed">Generate QR Code</button>
            <button disabled className="bg-green-200 text-green-800 px-4 py-2 rounded cursor-not-allowed">View Orders</button>
          </div>
          <p className="text-sm text-gray-500 mt-2">All buttons active after signup</p>
        </div>

        <div className="text-center">
          <Link to="/admin/signup" className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-bold text-lg">
            Start Free Trial →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DemoDashboard;