import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { UtensilsCrossed, LogOut, TrendingUp, ShoppingBag, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, loadingAuth] = useAuthState(auth);
  const [restaurantId, setRestaurantId] = useState(null); 
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, avgOrder: 0 });
  const [loading, setLoading] = useState(true);

  const COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5', '#ea580c'];

  
  useEffect(() => {
    if (!user) return;

    const fetchRestaurantId = async () => {
      try {
        const q = query(collection(db, 'restaurants'), where('ownerId', '==', user.uid));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setRestaurantId(snapshot.docs[0].id); 
        } else {
          toast.error("Restaurant not found.");
          setLoading(false);
        }
      } catch (error) {
        console.error("Restaurant fetch error:", error);
        setLoading(false);
      }
    };

    fetchRestaurantId();
  }, );

  
  useEffect(() => {
    
    if (loadingAuth ||!user ||!restaurantId) return;

    const ordersQuery = query(
      collection(db, 'restaurants', restaurantId, 'orders'), 
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
     ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      setOrders(ordersData);

      const revenue = ordersData.reduce((sum, order) => sum + (order.totalAmount || order.total || 0), 0);
      setStats({
        totalRevenue: revenue,
        totalOrders: ordersData.length,
        avgOrder: ordersData.length > 0? Math.round(revenue / ordersData.length) : 0
      });
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
      toast.error('Dashboard load failed: ' + error.message);
    });

    return () => unsubscribeOrders();
  }, [user, loadingAuth, restaurantId]); 

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/admin/login');
  };

  const getOrdersByDay = () => {
    const last7Days = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-US', { weekday: 'short' });
      last7Days[key] = 0;
    }

    orders.forEach(order => {
      if (order.createdAt) {
        const day = order.createdAt.toLocaleDateString('en-US', { weekday: 'short' });
        if (last7Days[day]!== undefined) last7Days[day]++;
      }
    });

    return Object.keys(last7Days).map(day => ({ name: day, orders: last7Days[day] }));
  };

  const getTopItems = () => {
    const itemCounts = {};
    orders.forEach(order => {
      order.items?.forEach(item => {
        itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
      });
    });

    return Object.entries(itemCounts)
.map(([name, count]) => ({ name, value: count }))
.sort((a, b) => b.value - a.value)
.slice(0, 5);
  };

  if (loadingAuth || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <UtensilsCrossed className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">DineQR Dashboard</h1>
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl transition">
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 font-semibold">Total Revenue</p>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-4xl font-bold text-gray-900">Rs. {stats.totalRevenue.toLocaleString()}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 font-semibold">Total Orders</p>
              <ShoppingBag className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-4xl font-bold text-gray-900">{stats.totalOrders}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 font-semibold">Avg Order Value</p>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
            <p className="text-4xl font-bold text-gray-900">Rs. {stats.avgOrder}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Orders This Week</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getOrdersByDay()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Bar dataKey="orders" fill="#f97316" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Top 5 Items</h3>
            {getTopItems().length > 0? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={getTopItems()} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={100} fill="#8884d8" dataKey="value">
                    {getTopItems().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                No orders yet
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">Recent Orders</h3>
          </div>
          {orders.length === 0? (
            <div className="p-12 text-center text-gray-500">
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No orders yet. Share your QR code to get started!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Order ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Items</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.slice(0, 10).map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-mono text-gray-600">#{order.id.slice(0, 6)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {order.items?.map(i => `${i.name} x${i.quantity}`).join(', ')}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-orange-600">Rs. {order.totalAmount || order.total}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {order.createdAt?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}