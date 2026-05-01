import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { BarChart3, TrendingUp, Clock, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsPage() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('week');
  const [stats, setStats] = useState({
    tableRevenue: [],
    hourlyOrders: [],
    topItems: [],
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0
  });

  useEffect(() => {
    fetchAnalytics();
  }, [currentUser, dateRange]);

  const fetchAnalytics = async () => {
    if (!currentUser?.uid) return;
    setLoading(true);

    try {
      // Date filter
      const now = new Date();
      let startDate = new Date(0); // All time
      if (dateRange === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (dateRange === 'month') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      const q = query(
        collection(db, 'orders'),
        where('restaurantId', '==', currentUser.uid),
        where('status', '==', 'completed')
      );

      const snapshot = await getDocs(q);
      const orders = snapshot.docs
      .map(doc => ({ id: doc.id,...doc.data() }))
      .filter(order => {
          const orderDate = order.createdAt?.toDate? order.createdAt.toDate() : new Date(0);
          return orderDate >= startDate;
        });

      // 1. TABLE REVENUE
      const tableMap = {};
      orders.forEach(order => {
        const table = order.tableId || order.tableNumber || 'Unknown';
        if (!tableMap[table]) {
          tableMap[table] = { table, revenue: 0, orders: 0 };
        }
        tableMap[table].revenue += order.totalAmount || order.total || 0;
        tableMap[table].orders += 1;
      });
      const tableRevenue = Object.values(tableMap).sort((a, b) => b.revenue - a.revenue);

      // 2. HOURLY ORDERS
      const hourMap = {};
      for (let i = 0; i < 24; i++) {
        hourMap[i] = { hour: `${i}:00`, orders: 0, revenue: 0 };
      }
      orders.forEach(order => {
        const date = order.createdAt?.toDate? order.createdAt.toDate() : new Date();
        const hour = date.getHours();
        hourMap[hour].orders += 1;
        hourMap[hour].revenue += order.totalAmount || order.total || 0;
      });
      const hourlyOrders = Object.values(hourMap).filter(h => h.orders > 0);

      // 3. TOP ITEMS
      const itemMap = {};
      orders.forEach(order => {
        order.items?.forEach(item => {
          const name = item.name;
          if (!itemMap[name]) {
            itemMap[name] = { name, qty: 0, revenue: 0 };
          }
          itemMap[name].qty += item.quantity || item.qty || 1;
          itemMap[name].revenue += item.price * (item.quantity || item.qty || 1);
        });
      });
      const topItems = Object.values(itemMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

      // 4. TOTALS
      const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0);
      const totalOrders = orders.length;
      const avgOrderValue = totalOrders > 0? totalRevenue / totalOrders : 0;

      setStats({
        tableRevenue,
        hourlyOrders,
        topItems,
        totalRevenue,
        totalOrders,
        avgOrderValue
      });
    } catch (error) {
      console.error('Analytics error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Analytics</h2>

        {/* Date Filter */}
        <div className="flex gap-2">
          {['week', 'month', 'all'].map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-lg font-semibold capitalize ${
                dateRange === range
               ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600'
              }`}
            >
              {range === 'all'? 'All Time' : `Last ${range}`}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8" />
            <span className="text-3xl font-bold">Rs. {stats.totalRevenue.toFixed(0)}</span>
          </div>
          <p className="text-orange-100">Total Revenue</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="w-8 h-8" />
            <span className="text-3xl font-bold">{stats.totalOrders}</span>
          </div>
          <p className="text-blue-100">Total Orders</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-8 h-8" />
            <span className="text-3xl font-bold">Rs. {stats.avgOrderValue.toFixed(0)}</span>
          </div>
          <p className="text-green-100">Avg Order Value</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Table */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-500" />
            Revenue by Table
          </h3>
          {stats.tableRevenue.length === 0? (
            <p className="text-gray-500 text-center py-12">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.tableRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="table" />
                <YAxis />
                <Tooltip formatter={(value) => `Rs. ${value}`} />
                <Bar dataKey="revenue" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Peak Hours */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            Peak Hours
          </h3>
          {stats.hourlyOrders.length === 0? (
            <p className="text-gray-500 text-center py-12">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.hourlyOrders}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="orders" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Items */}
        <div className="bg-white rounded-xl p-6 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-green-500" />
            Top Selling Items
          </h3>
          <div className="space-y-3">
            {stats.topItems.length === 0? (
              <p className="text-gray-500 text-center py-8">No items sold yet</p>
            ) : (
              stats.topItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-gray-300">#{idx + 1}</span>
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.qty} sold</p>
                    </div>
                  </div>
                  <span className="font-bold text-green-600">Rs. {item.revenue.toFixed(0)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}