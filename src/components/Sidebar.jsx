import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Settings, LogOut, X, UtensilsCrossed, ShoppingBag, QrCode, ListOrdered, BarChart3, MessageSquare } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

export default function Sidebar({ isOpen, setIsOpen, restaurantName, restaurantLogo }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/admin/login');
  };

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { name: 'Menu Items', icon: ListOrdered, path: '/admin/menu' },
    { name: 'Orders', icon: ShoppingBag, path: '/admin/orders' },
    { name: 'Tables & QR', icon: QrCode, path: '/admin/tables' },
    { name: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
    { name: 'Feedback', icon: MessageSquare, path: '/admin/feedback' },
    { name: 'Settings', icon: Settings, path: '/admin/settings' },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      <div className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50 transform transition-transform lg:translate-x-0 ${
        isOpen? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8 lg:hidden">
            <h2 className="text-xl font-bold text-gray-900">Menu</h2>
            <button onClick={() => setIsOpen(false)}>
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          <div className="flex items-center gap-3 mb-8">
            {restaurantLogo? (
              <img
                src={restaurantLogo}
                alt="Logo"
                className="w-10 h-10 object-contain rounded-xl border border-gray-200 bg-white p-1"
              />
            ) : (
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6 text-orange-600" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-gray-900 truncate">{restaurantName}</h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${
                  location.pathname === item.path
                   ? 'bg-orange-50 text-orange-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-600 hover:bg-red-50 transition"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </nav>
        </div>
      </div>
    </>
  );
}