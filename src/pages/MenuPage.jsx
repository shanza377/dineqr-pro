import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Plus, Trash2, UtensilsCrossed, Loader2, Image as ImageIcon } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const MenuPage = () => {
  const [user, loadingAuth] = useAuthState(auth);
  const [restaurantId, setRestaurantId] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', price: '', description: '', category: '' });

  
  useEffect(() => {
    if (!user) return;
    const fetchRestaurantId = async () => {
      const q = query(collection(db, 'restaurants'), where('ownerId', '==', user.uid));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setRestaurantId(snapshot.docs[0].id);
      } else {
        toast.error("Restaurant not found");
        setLoading(false);
      }
    };
    fetchRestaurantId();
  }, );

  
  useEffect(() => {
    if (loadingAuth ||!user ||!restaurantId) return;

    const menuRef = collection(db, 'restaurants', restaurantId, 'menuItems');
    const unsubscribe = onSnapshot(menuRef, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id,...doc.data() }));
      setMenuItems(items);
      setLoading(false);
    }, (error) => {
      console.error("Menu load error:", error);
      toast.error("Menu load failed: " + error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, loadingAuth, restaurantId]);

  
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!user ||!restaurantId) return;

    if (!newItem.name ||!newItem.price) {
      toast.error("Name aur Price zaroori hai");
      return;
    }

    try {
      const menuRef = collection(db, 'restaurants', restaurantId, 'menuItems');
      await addDoc(menuRef, {
        name: newItem.name,
        price: Number(newItem.price),
        description: newItem.description,
        category: newItem.category || 'General',
        createdAt: new Date()
      });
      toast.success("Menu item added!");
      setNewItem({ name: '', price: '', description: '', category: '' });
      setShowAddModal(false);
    } catch (error) {
      console.error("Add item error:", error);
      toast.error("Permission denied: " + error.message);
    }
  };

  const handleDeleteItem = async (itemId, itemName) => {
    if (!window.confirm(`Delete ${itemName}?`)) return;
    try {
      await deleteDoc(doc(db, 'restaurants', restaurantId, 'menuItems', itemId));
      toast.success("Item deleted!");
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  if (loadingAuth || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <span className="ml-2">Loading Menu...</span>
      </div>
    );
  }

  return (
    <div>
      <Toaster position="top-right" />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Menu Items</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition flex items-center gap-2"
        >
          <Plus size={20} />
          Add New Item
        </button>
      </div>

      {menuItems.length === 0? (
        <div className="bg-white p-12 rounded-2xl border text-center">
          <UtensilsCrossed className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-semibold">No menu items yet</p>
          <p className="text-gray-400 text-sm mt-2">Click "Add New Item" to create your first dish</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map(item => (
            <div key={item.id} className="bg-white rounded-2xl border p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-xl text-gray-900">{item.name}</h3>
                  <p className="text-orange-600 font-bold text-lg">Rs. {item.price}</p>
                  <p className="text-gray-500 text-sm mt-1">{item.category}</p>
                </div>
                <button
                  onClick={() => handleDeleteItem(item.id, item.name)}
                  className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <p className="text-gray-600 text-sm">{item.description}</p>
            </div>
          ))}
        </div>
      )}

      
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Add Menu Item</h2>
            <form onSubmit={handleAddItem} className="space-y-4">
              <input
                type="text"
                placeholder="Item Name"
                value={newItem.name}
                onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                className="w-full border rounded-lg px-4 py-2"
                required
              />
              <input
                type="number"
                placeholder="Price"
                value={newItem.price}
                onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                className="w-full border rounded-lg px-4 py-2"
                required
              />
              <input
                type="text"
                placeholder="Category e.g. Burger, Pizza"
                value={newItem.category}
                onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                className="w-full border rounded-lg px-4 py-2"
              />
              <textarea
                placeholder="Description"
                value={newItem.description}
                onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                className="w-full border rounded-lg px-4 py-2"
                rows="3"
              />
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-orange-500 text-white py-2 rounded-lg">
                  Add Item
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-gray-200 py-2 rounded-lg">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuPage;