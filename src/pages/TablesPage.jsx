import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Plus, Trash2, QrCode } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const TablesPage = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, loadingAuth]=useAuthState(auth);

  useEffect(() => {
    if (loadingAuth||!user) {
      setLoading(false);
      return;
    }

   
    const tablesRef = collection(db, 'restaurants', user.uid, 'tables');
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
      toast.error("Tables load failed");
      setLoading(false);
    });

    return () => unsubscribe();
  }, );

  const handleAddTable = async () => {
    if (!user) return;

    const tableNumber = tables.length + 1;
    try {
      
      const tablesRef = collection(db, 'restaurants', user.uid, 'tables');

      await addDoc(tablesRef, {
        tableNumber: tableNumber,
        name: `Table ${tableNumber}`,
        createdAt: new Date()
      });

      toast.success(`Table ${tableNumber} added!`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to add table");
    }
  };

  const handleDeleteTable = async (tableId) => {
    if (!user) return;

    try {
      
      await deleteDoc(doc(db, 'restaurants', user.uid, 'tables', tableId));
      toast.success("Table deleted!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete table");
    }
  };

  if (loading) {
    return <div className="text-center py-20">Loading tables...</div>;
  }

  return (
    <div>
      <Toaster position="top-right" />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tables</h1>
        <button
          onClick={handleAddTable}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Add New Table
        </button>
      </div>

      {tables.length === 0? (
        <div className="bg-white p-12 rounded-2xl border text-center">
          <p className="text-gray-500 text-lg">No tables yet</p>
          <p className="text-gray-400 text-sm mt-2">Click "Add New Table" to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tables.map(table => (
            <div key={table.id} className="bg-white rounded-2xl border p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-xl">{table.name}</h3>
                  <p className="text-gray-600">Table #{table.tableNumber}</p>
                </div>
                <button
                  onClick={() => handleDeleteTable(table.id)}
                  className="text-red-500 hover:bg-red-50 p-2 rounded-lg"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="bg-gray-100 p-4 rounded-lg text-center">
                <QrCode className="w-16 h-16 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">QR Code</p>
                <p className="text-xs text-gray-400 mt-1 break-all">
                  /menu/{user.uid}/{table.id}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TablesPage;