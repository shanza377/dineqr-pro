import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import MenuPage from './pages/MenuPage';
import Settings from './pages/Settings';
import OrdersPage from './pages/OrdersPage';
import Landing from './pages/Landing';
import AdminLogin from './pages/AdminLogin';
import Adminsignup from './pages/Adminsignup';
import TablesPage from './pages/TablesPage';
import DemoDashboard from './pages/DemoDashboard';
import PublicMenu from './pages/PublicMenu';
import OrderTracking from './pages/OrderTracking';
import MyOrders from './pages/MyOrders';
import FeedbackPage from './pages/FeedbackPage';
import AnalyticsPage from './pages/AnalyticsPage';
import FeedbackAdminPage from './pages/FeedbackAdminPage';
import { BasketProvider } from './context/BasketContext';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <BasketProvider>
      <BrowserRouter>
        <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/signup" element={<Adminsignup />} />
        <Route path="/demo" element={<DemoDashboard />} />
        <Route path="/menu/:restaurantId/:tableId" element={<PublicMenu />} />
        <Route path="/my-orders/:restaurantId/:tableId" element={<MyOrders />} />
        <Route path="/track/:orderId" element={<OrderTracking />} />
        <Route path="/feedback/:orderId" element={<FeedbackPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="menu" element={<MenuPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="tables" element={<TablesPage />} />
          <Route path="analytics" element={<AnalyticsPage />} /> 
          <Route path="feedback" element={<FeedbackAdminPage />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </BasketProvider>
    </AuthProvider>
  );
}

export default App;