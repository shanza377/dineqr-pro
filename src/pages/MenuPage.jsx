import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import toast, { Toaster } from 'react-hot-toast';

const MenuPage = () => {
  const [user, loadingAuth] = useAuthState(auth);
  const [restaurantId, setRestaurantId] = useState(null); // ← YE ADD KAR
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Step 1: Pehle restaurantId nikalo
  useEffect(() => {
    if (!user) return;

    const fetchRestaurantId = async () => {
      const q = query(collection(db, 'restaurants'), where('ownerId', '==', user.uid));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setRestaurantId(snapshot.docs[0].id); // ← A9Ty2ydESEkBHP5n4zG3 mile ga
      }
    };
    fetchRestaurantId();
  }, );

  // Step 2: Menu items lao
  useEffect(() => {
    if (loadingAuth ||!user ||!restaurantId) return; // ← Guard

    const menuRef = collection(db, 'restaurants', restaurantId, 'menuItems'); // ← YE LINE THEEK KI
    const unsubscribe = onSnapshot(menuRef, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id,...doc.data() }));
      setMenuItems(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, loadingAuth, restaurantId]);

  // Step 3: Item add karo
  const handleAddItem = async (itemData) => {
    if (!user ||!restaurantId) {
      toast.error("Restaurant nahi mila");
      return;
    }

    try {
      const menuRef = collection(db, 'restaurants', restaurantId, 'menuItems'); // ← YE BHI THEEK KI
      await addDoc(menuRef, {
    ...itemData,
        createdAt: new Date()
      });
      toast.success("Menu item added!");
    } catch (error) {
      console.error("Add item error:", error);
      toast.error("Permission denied: " + error.message);
    }
  };

  if (loadingAuth || loading) return <div>Loading...</div>;

  return (
    <div>
      <Toaster />
      <h1>Menu Items</h1>
      <button onClick={() => handleAddItem({ name: "Test Burger", price: 500 })}>
        Add Test Item
      </button>

      {menuItems.map(item => (
        <div key={item.id}>{item.name} - Rs.{item.price}</div>
      ))}
    </div>
  );
};

export default MenuPage;