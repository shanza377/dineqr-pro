import React from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, QrCode, Zap, BarChart3 } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dine-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-dine-500 to-orange-600 rounded-xl flex items-center justify-center">
              <UtensilsCrossed className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">DineQR Pro</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link 
              to="/admin/login" 
              className="text-gray-700 font-semibold hover:text-dine-600 transition"
            >
              Login
            </Link>
            <Link 
              to="/admin/signup" 
              className="bg-gradient-to-r from-dine-500 to-orange-600 text-white px-5 py-2 rounded-xl font-semibold hover:shadow-lg transition"
            >
              Sign Up Free
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6">
            <span className="bg-gradient-to-r from-dine-600 via-orange-600 to-dine-700 bg-clip-text text-transparent">
              Scan.
            </span>
            <br />
            <span className="text-gray-900">Order.</span>
            <br />
            <span className="text-gray-900">Done.</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Digital menus for modern restaurants. Let customers order directly from their table.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/menu/demo"
              className="bg-white border-2 border-dine-500 text-dine-600 px-8 py-4 rounded-2xl font-bold hover:bg-dine-50 transition text-center"
            >
              View Demo Menu
            </Link>
            <Link
              to="/admin/signup"
              className="bg-white text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg border border-gray-200 hover:border-dine-300 transition inline-block"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-orange-100">
            <div className="w-12 h-12 bg-dine-100 rounded-xl flex items-center justify-center mb-4">
              <QrCode className="w-6 h-6 text-dine-600" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">QR Code Menus</h3>
            <p className="text-gray-600">Generate unique QR codes for each table. Customers scan and browse instantly.</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-orange-100">
            <div className="w-12 h-12 bg-dine-100 rounded-xl flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-dine-600" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">Real-time Orders</h3>
            <p className="text-gray-600">Receive orders instantly on your dashboard. No delays, no confusion.</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-orange-100">
            <div className="w-12 h-12 bg-dine-100 rounded-xl flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-dine-600" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">Analytics Dashboard</h3>
            <p className="text-gray-600">Track popular items, peak hours, and revenue with detailed insights.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-orange-100 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-500">
            © 2026 DineQR Pro. Built with React + Firebase + Tailwind CSS
          </p>
        </div>
      </footer>
    </div>
  );
}