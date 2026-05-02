import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, CLOUDINARY_URL, CLOUDINARY_UPLOAD_PRESET } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Plus, Trash2, Edit, Loader2, UtensilsCrossed, Upload, Link } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const MenuPage = () => {
  const [restaurantId, setRestaurantId] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [dishName, setDishName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Main Course');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState(''); 
  const [imageSource, setImageSource] = useState('upload'); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setRestaurantId(user.uid);
      } else {
        setLoading(false);
        toast.error('Please login first');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!restaurantId) return;
    const menuRef = collection(db, 'restaurants', restaurantId, 'menuItems');
    const unsubscribe = onSnapshot(query(menuRef), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id,...doc.data() }));
      setMenuItems(items);
      setLoading(false);
    }, (error) => {
      toast.error('Failed to load menu: ' + error.message);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [restaurantId]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setImageUrlInput(''); 
    }
  };

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setImageUrlInput(url);
    setImagePreview(url); 
    setImageFile(null); 
  };

  const uploadImage = async () => {
    if (!imageFile) return null;
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const res = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Upload failed');
    return data.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!restaurantId) return toast.error('Please login again');
    if (!dishName.trim() ||!price) return toast.error('Name and Price required');

    setUploading(true);
    try {
      let finalImageUrl = editingItem?.image || '';

      if (imageSource === 'upload' && imageFile) {
        finalImageUrl = await uploadImage();
      }
      else if (imageSource === 'url' && imageUrlInput.trim()) {
        finalImageUrl = imageUrlInput.trim();
      }

      const menuRef = collection(db, 'restaurants', restaurantId, 'menuItems');
      if (editingItem) {
        await updateDoc(doc(db, 'restaurants', restaurantId, 'menuItems', editingItem.id), {
          name: dishName.trim(),
          price: Number(price),
          category: category,
          image: finalImageUrl,
          updatedAt: serverTimestamp()
        });
        toast.success('Item updated!');
      } else {
        await addDoc(menuRef, {
          name: dishName.trim(),
          price: Number(price),
          category: category,
          image: finalImageUrl,
          available: true,
          createdAt: serverTimestamp()
        });
        toast.success('Menu item added!');
      }
      resetForm();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(`Failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await deleteDoc(doc(db, 'restaurants', restaurantId, 'menuItems', id));
      toast.success('Item deleted');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setDishName(item.name);
    setPrice(item.price.toString());
    setCategory(item.category);
    setImagePreview(item.image || '');
    setImageUrlInput(item.image || '');
    setImageFile(null);
    setImageSource('url'); 
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setDishName('');
    setPrice('');
    setCategory('Main Course');
    setImageFile(null);
    setImagePreview('');
    setImageUrlInput('');
    setImageSource('upload');
    setEditingItem(null);
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-4" />
      <p className="text-gray-600">Loading menu...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <Toaster position="top-center" />
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Menu Items</h1>
            <p className="text-gray-600 mt-1">Restaurant ID: {restaurantId || 'Not found'}</p>
          </div>
          <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition">
            <Plus className="w-5 h-5" /> Add Item
          </button>
        </div>

        {menuItems.length === 0? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <UtensilsCrossed className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No menu items yet</h3>
            <p className="text-gray-500">Click "+ Add Item" to add your first dish</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map(item => (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition">
                {item.image && <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
                    <span className="text-xl font-bold text-orange-600">Rs. {item.price}</span>
                  </div>
                  <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">{item.category}</span>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => handleEdit(item)} className="flex-1 p-2 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center justify-center gap-2"><Edit className="w-4 h-4" /> Edit</button>
                    <button onClick={() => handleDelete(item.id)} className="flex-1 p-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center gap-2"><Trash2 className="w-4 h-4" /> Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-6">{editingItem? 'Edit Menu Item' : 'Add Menu Item'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dish Name</label>
                <input type="text" value={dishName} onChange={(e) => setDishName(e.target.value)} placeholder="e.g. Zinger Burger" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price (Rs.)</label>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 550" min="1" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none">
                  <option value="Main Course">Main Course</option>
                  <option value="Appetizer">Appetizer</option>
                  <option value="Dessert">Dessert</option>
                  <option value="Beverage">Beverage</option>
                </select>
              </div>

              {/* NAYA: IMAGE SOURCE SELECTOR */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setImageSource('upload')}
                    className={`flex-1 py-2 px-3 rounded-lg border-2 flex items-center justify-center gap-2 ${imageSource === 'upload'? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-300 text-gray-600'}`}
                  >
                    <Upload className="w-4 h-4" /> Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageSource('url')}
                    className={`flex-1 py-2 px-3 rounded-lg border-2 flex items-center justify-center gap-2 ${imageSource === 'url'? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-300 text-gray-600'}`}
                  >
                    <Link className="w-4 h-4" /> URL
                  </button>
                </div>

                {/* UPLOAD MODE */}
                {imageSource === 'upload' && (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-orange-500 transition">
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="image-upload" />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      {imagePreview? (
                        <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg mb-2" />
                      ) : (
                        <div className="py-8">
                          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600">Click to upload image</p>
                        </div>
                      )}
                    </label>
                  </div>
                )}

                {/* URL MODE */}
                {imageSource === 'url' && (
                  <div>
                    <input
                      type="url"
                      value={imageUrlInput}
                      onChange={handleUrlChange}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none mb-3"
                    />
                    {imagePreview && (
                      <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={uploading} className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2">
                  {uploading? <><Loader2 className="w-5 h-5 animate-spin" /> Uploading...</> : <>{editingItem? 'Update' : 'Add'} Item</>}
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