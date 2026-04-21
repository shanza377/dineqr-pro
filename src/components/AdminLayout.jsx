import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const AdminLayout = () => {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 bg-gray-50 min-h-screen p-8">
        <Outlet /> {/* Yahan baaki pages load hon ge */}
      </div>
    </div>
  );
};

export default AdminLayout;