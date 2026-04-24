import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Plus, Trash2, Edit, QrCode, Loader2, Users } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import QRCodeModal from '../components/QRCodeModal';

const TablesPage = () => {
  const [restaurantId, setRestaurantId] = useState(null);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qrModal, setQrModal] = useState({ isOpen: false, table: null });
  const [editingTable, setEditingTable] = useState(null);

  // Form states
  const [tableId, setTableId] = useState('');
  const [capacity, setCapacity] = useState('');
  const [status, setStatus] = useState('available');

  // Get restaurantId from logged-in user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setRestaurantId(user.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch tables in real-time
  useEffect(() => {
    if (!restaurantId) return;

    const tablesRef = collection(db, 'restaurants', restaurantId, 'tables');
    const q = query(tablesRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tablesData = snapshot.docs.map(doc => ({
        id: doc.id,
       ...doc.data()
      }));
      setTables(tablesData);
      setLoading(false);
    }, (error) => {
      console.error('Firestore error:', error);
      toast.error('Failed to load tables');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [restaurantId]);

  // Add or Update Table - FIXED
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tableId.trim()) return toast.error('Table ID required');
    if (!capacity || Number(capacity) < 1) return toast.error('Valid capacity required');
    if (!restaurantId) return toast.error('Please login again');

    try {
      const tableRef = doc(db, 'restaurants', restaurantId, 'tables', tableId.trim());

      if (editingTable) {
        // Update existing table
        await updateDoc(tableRef, {
          capacity: Number(capacity),
          status: status,
          updatedAt: serverTimestamp()
        });
        toast.success('Table updated!');
      } else {
        // Create new table with setDoc
        await setDoc(tableRef, {
          id: tableId.trim(),
          tableId: tableId.trim(),
          capacity: Number(capacity),
          status: status,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        toast.success('Table added!');
      }

      resetForm();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Firebase Error:', error);
      if (error.code === 'permission-denied') {
        toast.error('Permission denied. Check Firestore rules');
      } else {
        toast.error(`Failed: ${error.message}`);
      }
    }
  };

  // Delete Table
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this table? QR code will stop working.')) return;
    try {
      await deleteDoc(doc(db, 'restaurants', restaurantId, 'tables', id));
      toast.success('Table deleted');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  // Edit Table
  const handleEdit = (table) => {
    setEditingTable(table);
    setTableId(table.tableId || table.id);
    setCapacity(table.capacity.toString());
    setStatus(table.status);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setTableId('');
    setCapacity('');
    setStatus('available');
    setEditingTable(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!restaurantId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Please login to manage tables</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <Toaster position="top-center" />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tables</h1>
            <p className="text-gray-600 mt-1">Manage your restaurant tables and QR codes</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Add Table
          </button>
        </div>

        {/* Tables Grid */}
        {tables.length === 0? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No tables yet</h3>
            <p className="text-gray-500">Click "+ Add Table" on the top right to add your first table and generate QR codes</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tables.map(table => (
              <div key={table.id} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Table {table.tableId || table.id}</h3>
                    <p className="text-gray-600 flex items-center gap-1 mt-1">
                      <Users className="w-4 h-4" />
                      Capacity: {table.capacity} persons
                    </p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 ${
                      table.status === 'available'
                       ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {table.status}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(table)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(table.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* QR Button */}
                <button
                  onClick={() => setQrModal({ isOpen: true, table })}
                  className="w-full mt-4 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition"
                >
                  <QrCode className="w-5 h-5" />
                  Show QR Code
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-6">
              {editingTable? 'Edit Table' : 'Add New Table'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Table ID</label>
                <input
                  type="text"
                  value={tableId}
                  onChange={(e) => setTableId(e.target.value)}
                  placeholder="e.g. T1, T2, A1"
                  disabled={!!editingTable}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                {editingTable && <p className="text-xs text-gray-500 mt-1">Table ID cannot be changed</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="e.g. 4"
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600"
                >
                  {editingTable? 'Update' : 'Add'} Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={qrModal.isOpen}
        onClose={() => setQrModal({ isOpen: false, table: null })}
        restaurantId={restaurantId}
        table={qrModal.table}
      />
    </div>
  );
};

export default TablesPage;