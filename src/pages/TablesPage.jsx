import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, QrCode, Trash2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const TablesPage = () => {
  const [tables, setTables] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [tableName, setTableName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(null); // For QR modal
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Real-time listener for tables collection
    const q = query(
      collection(db, 'tables'),
      where('restaurantId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tablesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTables(tablesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleAddTable = async (e) => {
    e.preventDefault();
    if (!tableName.trim()) {
      toast.error('Please enter a table name');
      return;
    }

    try {
      // Add new table to Firestore
      await addDoc(collection(db, 'tables'), {
        name: tableName,
        restaurantId: user.uid,
        createdAt: serverTimestamp()
      });
      toast.success(`${tableName} added successfully!`);
      setTableName('');
      setShowAddModal(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to add table');
    }
  };

  // Delete table from Firestore
  const handleDeleteTable = async (tableId, tableName) => {
    // Confirm before deleting
    if (!window.confirm(`Are you sure you want to delete "${tableName}"? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'tables', tableId));
      toast.success(`${tableName} deleted successfully`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete table');
    }
  };

  const getMenuUrl = (tableId) => {
    // For mobile testing use your network IP
    // Replace 192.168.1.4 with your actual IP from terminal
    const baseUrl = window.location.origin; 
    return `${baseUrl}/menu/${user.uid}?table=${tableId}`;
  };

  if (loading) {
    return <div className="text-center py-20">Loading tables...</div>;
  }

  return (
    <div>
      <Toaster position="top-right" />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tables & QR Codes</h1>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 relative z-50 cursor-pointer"
        >
          <Plus size={20} />
          Add New Table
        </button>
      </div>

      {tables.length === 0? (
        <div className="bg-white p-12 rounded-2xl border text-center">
          <p className="text-gray-500 text-lg">No tables added yet</p>
          <p className="text-gray-400 text-sm mt-2">Add tables to generate QR codes for your restaurant</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tables.map(table => (
            <div key={table.id} className="bg-white rounded-2xl border p-6 text-center relative">
              {/* Delete Button - Top Right Corner */}
              <button
                onClick={() => handleDeleteTable(table.id, table.name)}
                className="absolute top-3 right-3 text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors cursor-pointer"
                title="Delete Table"
              >
                <Trash2 size={18} />
              </button>

              <h3 className="font-bold text-xl mb-4 mt-2">{table.name}</h3>
              <div className="bg-gray-50 p-4 rounded-lg mb-4 flex justify-center">
                <QRCodeSVG 
                  value={getMenuUrl(table.id)} 
                  size={150}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="text-xs text-gray-500 mb-3 break-all">{getMenuUrl(table.id)}</p>
              <button
                onClick={() => setShowQR(table)}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 flex items-center gap-2 mx-auto cursor-pointer"
              >
                <QrCode size={18} />
                View QR
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Table Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6 cursor-pointer">Add New Table</h2>
            <form onSubmit={handleAddTable}>
              <label className="block text-sm font-medium mb-2">Table Name</label>
              <input
                type="text"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="e.g. Table 1, Rooftop, VIP"
                className="w-full border rounded-lg px-4 py-2 mb-6 focus:ring-2 focus:ring-red-500 outline-none"
                autoFocus
              />
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer"
                >
                  Add Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR View Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowQR(null)}>
          <div className="bg-white rounded-2xl p-8 text-center" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-2">{showQR.name}</h2>
            <p className="text-gray-500 mb-6">Scan to view menu</p>
            <div className="bg-white p-6 rounded-lg border-2 border-dashed">
              <QRCodeSVG 
                value={getMenuUrl(showQR.id)} 
                size={256}
                level="H"
                includeMargin={true}
              />
            </div>
            <p className="text-xs text-gray-400 mt-4 mb-6">Right click → Save image to print</p>
            <button
              onClick={() => setShowQR(null)}
              className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TablesPage;