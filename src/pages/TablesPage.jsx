import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Plus, Trash2, QrCode, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const TablesPage = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, loadingAuth] = useAuthState(auth);
  const [restaurantId, setRestaurantId] = useState(null); // ← YE ADD KIYA

  // Step 1: Pehle restaurantId nikalo
  useEffect(() => {
    if (!user) return;

    const fetchRestaurantId = async () => {
      try {
        const q = query(collection(db, 'restaurants'), where('ownerId', '==', user.uid));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setRestaurantId(snapshot.docs[0].id);
        } else {
          toast.error("Restaurant nahi mila");
          setLoading(false);
        }
      } catch (error) {
        console.error("Restaurant fetch error:", error);
        setLoading(false);
      }
    };

    fetchRestaurantId();
  }, );

  // Step 2: Jab restaurantId mile tab tables lao
  useEffect(() => {
    if (loadingAuth ||!user ||!restaurantId) return; // ← Guard add kiya

    setLoading(true);
    console.log("Fetching tables for restaurant:", restaurantId);

    const tablesRef = collection(db, 'restaurants', restaurantId, 'tables'); // ← YE LINE THEEK KI
    const q = query(tablesRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
    ...doc.data()
      }));
      setTables(items);
      setLoading(false);
    }, (error) => {
      console.error("Tables load error:", error);
      toast.error("Tables load failed: " + error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, loadingAuth, restaurantId]); // ← restaurantId dependency add ki

  const handleAddTable = async () => {
    if (!user ||!restaurantId) { // ← restaurantId check add kiya
      toast.error("Restaurant nahi mila");
      return;
    }

    const tableNumber = tables.length + 1;
    try {
      const tablesRef = collection(db, 'restaurants', restaurantId, 'tables'); // ← YE BHI THEEK KI
      await addDoc(tablesRef, {
        tableNumber: tableNumber,
        name: `Table ${tableNumber}`,
        createdAt: new Date()
      });
      toast.success(`Table ${tableNumber} added!`);
    } catch (error) {
      console.error("Add table error:", error);
      toast.error("Failed to add table: " + error.message);
    }
  };

  const handleDeleteTable = async (tableId, tableName) => {
    if (!user ||!restaurantId) return; // ← restaurantId check add kiya

    if (!window.confirm(`Delete ${tableName}?`)) return;

    try {
      await deleteDoc(doc(db, 'restaurants', restaurantId, 'tables', tableId)); // ← YE BHI THEEK KI
      toast.success("Table deleted!");
    } catch (error) {
      console.error("Delete table error:", error);
      toast.error("Failed to delete table");
    }
  };

  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        <span className="ml-2">Checking login...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-xl font-semibold text-gray-700">Please login to manage tables</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        <span className="ml-2">Loading tables...</span>
      </div>
    );
  }

  return (
    <div>
      <Toaster position="top-right" />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Tables</h1>
        <button
          onClick={handleAddTable}
          className="bg-gradient-to-r from-red-500 to-orange-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition flex items-center gap-2 cursor-pointer"
        >
          <Plus size={20} />
          Add New Table
        </button>
      </div>

      {tables.length === 0? (
        <div className="bg-white p-12 rounded-2xl border text-center">
          <QrCode className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-semibold">No tables yet</p>
          <p className="text-gray-400 text-sm mt-2">Click "Add New Table" to create your first table & QR code</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tables.map(table => (
            <div key={table.id} className="bg-white rounded-2xl border p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-xl text-gray-900">{table.name}</h3>
                  <p className="text-gray-600">Table #{table.tableNumber}</p>
                </div>
                <button
                  onClick={() => handleDeleteTable(table.id, table.name)}
                  className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg text-center border-2 border-dashed border-gray-200">
                <QrCode className="w-16 h-16 mx-auto text-gray-400 mb-2" />
                <p className="text-sm font-semibold text-gray-700">QR Code</p>
                <p className="text-xs text-gray-400 mt-1 break-all">
                  /menu/{restaurantId}/{table.id} {/* ← YE BHI THEEK KAR DIYA */}
                </p>
                <button
                  className="mt-3 text-xs bg-gray-200 px-3 py-1 rounded-full text-gray-600 hover:bg-gray-300"
                  onClick={() => toast("QR Download coming soon!")}
                >
                  Download QR
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TablesPage;