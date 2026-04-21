import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import AddItemModal from '../components/AddItemModal';
import { Plus } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast'; 

const MenuPage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false); 
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'menuItems'),
      where('restaurantId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMenuItems(items);
      setLoading(false);
    }, (error) => {
      console.error("Menu load error:", error);
      toast.error("Menu load failed");
      setLoading(false);
    });

    return () => unsubscribe();
  }, ); // ← user.uid dependency

  if (loading) {
    return <div className="text-center py-20">Loading menu...</div>;
  }

  return (
    <div>
      <Toaster position="top-right" />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Menu Items</h1>
        <button 
          onClick={() => setShowAddModal(true)} 
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 cursor-pointer"
        >
          <Plus size={20} />
          Add New Item
        </button>
      </div>

      {menuItems.length === 0? (
        <div className="bg-white p-12 rounded-2xl border text-center">
          <p className="text-gray-500 text-lg">No menu items yet</p>
          <p className="text-gray-400 text-sm mt-2">Click "Add New Item" to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map(item => (
            <div key={item.id} className="bg-white rounded-2xl border p-4">
              <img 
                src={item.imageUrl || 'https://via.placeholder.com/300'} 
                alt={item.name} 
                className="w-full h-40 object-cover rounded-lg mb-3" 
              />
              <h3 className="font-bold text-lg">{item.name}</h3>
              <p className="text-gray-600">{item.category}</p>
              <p className="text-red-600 font-bold text-xl mt-2">Rs. {item.price}</p>
            </div>
          ))}
        </div>
      )}

      
      <AddItemModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
      />
    </div>
  );
};

export default MenuPage;