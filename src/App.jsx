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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/signup" element={<Adminsignup />} />
        <Route path="/demo" element={<DemoDashboard />} />
        
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="menu" element={<MenuPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="tables" element={<TablesPage />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;