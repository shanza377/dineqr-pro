import React, { useState, useEffect, useRef } from 'react'; 
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, ShoppingBag, DollarSign, Bell } from 'lucide-react'; 
import toast, { Toaster } from 'react-hot-toast';

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const audioRef = useRef(null); 
  const prevOrderCount = useRef(0); 
  const isFirstLoad = useRef(true); 
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, avgOrder: 0 });
  const [loading, setLoading] = useState(true);

  const COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5', '#ea580c'];

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audioRef.current.volume = 0.5; 
  }, []);

  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    console.log('Fetching orders for UID:', currentUser.uid);

    const ordersQuery = query(
      collection(db, 'orders'),
      where('restaurantId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
      ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));

      console.log('Dashboard Orders fetched:', ordersData);

      const pendingOrders = ordersData.filter(o => o.status === 'pending');

      if (!isFirstLoad.current && pendingOrders.length > prevOrderCount.current) {
        audioRef.current?.play().catch(e => console.log('Audio play failed:', e));
        toast.success('🔔 New order received!', {
          icon: '🍽️',
          duration: 4000,
        });
      }

      prevOrderCount.current = pendingOrders.length;
      isFirstLoad.current = false;

      setOrders(ordersData);

      const completedOrders = ordersData.filter(o => o.status === 'completed' || o.status === 'served');
      const revenue = completedOrders.reduce((sum, order) => sum + (order.totalAmount || order.total || 0), 0);

      setStats({
        totalRevenue: revenue,
        totalOrders: ordersData.length,
        avgOrder: completedOrders.length > 0? Math.round(revenue / completedOrders.length) : 0
      });
      setLoading(false);
    }, (error) => {
      console.error("Dashboard error:", error);
      toast.error("Error loading dashboard: " + error.message);
      setLoading(false);
    });

    return () => unsubscribeOrders();
  }, [currentUser]);

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
        const qty = item.qty || item.quantity || 1;
        itemCounts[item.name] = (itemCounts[item.name] || 0) + qty;
      });
    });
    return Object.entries(itemCounts)
    .map(([name, count]) => ({ name, value: count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Toaster position="top-center" />
      <div className="max-w-7xl mx-auto">

        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 font-semibold">Total Revenue</p>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-4xl font-bold text-gray-900">Rs. {stats.totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Completed orders only</p>
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

        {/* CHARTS */}
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
                  <Pie
                    data={getTopItems()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {getTopItems().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">No orders yet</div>
            )}
          </div>
        </div>

        {/* RECENT ORDERS TABLE */}
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
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.slice(0, 10).map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-mono text-gray-600">#{order.id.slice(0, 6)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {order.items?.map(i => `${i.name} x${i.qty || i.quantity}`).join(', ')}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-orange-600">Rs. {order.totalAmount || order.total}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          order.status === 'completed' || order.status === 'served'? 'bg-green-100 text-green-700' :
                          order.status === 'preparing'? 'bg-blue-100 text-blue-700' :
                          order.status === 'ready'? 'bg-orange-100 text-orange-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {order.status}
                        </span>
                      </td>
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
      </div>
    </div>
  );
}