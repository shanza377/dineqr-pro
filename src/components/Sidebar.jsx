import { NavLink, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { LayoutDashboard, UtensilsCrossed, ShoppingBag, QrCode, Settings, LogOut } from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await signOut(auth);
    navigate('/admin/login');
  };

  const linkClass = "flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition";
  const activeClass = "bg-red-50 text-red-600 font-semibold";

  return (
    <div className="w-64 h-screen bg-white border-r p-5 flex-col">
      <h1 className="text-2xl font-bold mb-10">🍽️ DineQR Pro</h1>
      
      <nav className="flex flex-col gap-2 flex-1">
        <NavLink to="/admin/dashboard" className={({isActive}) => `${linkClass} ${isActive ? activeClass : ''}`}>
          <LayoutDashboard size={20} /> Dashboard
        </NavLink>
        
        <NavLink to="/admin/menu" className={({isActive}) => `${linkClass} ${isActive ? activeClass : ''}`}>
          <UtensilsCrossed size={20} /> Menu Items
        </NavLink>
        
        <NavLink to="/admin/orders" className={({isActive}) => `${linkClass} ${isActive ? activeClass : ''}`}>
          <ShoppingBag size={20} /> Orders
        </NavLink>
        
        <NavLink to="/admin/tables" className={({isActive}) => `${linkClass} ${isActive ? activeClass : ''}`}>
          <QrCode size={20} /> Tables & QR
        </NavLink>
        
        <NavLink to="/admin/settings" className={({isActive}) => `${linkClass} ${isActive ? activeClass : ''}`}>
          <Settings size={20} /> Settings
        </NavLink>
      </nav>

      <button onClick={handleLogout} className={`${linkClass} text-red-600`}>
        <LogOut size={20} /> Logout
      </button>
    </div>
  );
};

export default Sidebar;