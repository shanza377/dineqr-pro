import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, UtensilsCrossed } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user] = useAuthState(auth);
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantLogo, setRestaurantLogo] = useState('');

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'restaurants'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setRestaurantName(data.name || 'Restaurant');
        setRestaurantLogo(data.logoUrl || '');
      }
    });
    return () => unsubscribe();
  }, );

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        restaurantName={restaurantName}
        restaurantLogo={restaurantLogo}
      />

      <div className="lg:ml-64">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="px-6 py-4 flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-xl lg:hidden"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>

            {restaurantLogo? (
              <img
                src={restaurantLogo}
                alt="Logo"
                key={restaurantLogo}
                className="w-8 h-8 object-contain rounded-lg border border-gray-200 bg-white p-0.5"
              />
            ) : (
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-orange-600" />
              </div>
            )}
            <h1 className="text-xl font-bold text-gray-900">{restaurantName}</h1>
          </div>
        </header>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}