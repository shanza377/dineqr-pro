import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { X, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

const IMGBB_API_KEY = 'f56d3452792b38bb6ef9144c9e1c86ea';

export default function AddItemModal({ isOpen, onClose, restaurantId }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Main Course');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0]; // ✅ FIXED
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadToImgBB = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (data.success) {
      return data.data.url;
    } else {
      throw new Error('Image upload failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const user = auth.currentUser;
    if (!user) {
      toast.error("Please login first");
      setLoading(false);
      return;
    }

    try {
      let imageUrl = '';

      if (imageFile) {
        toast.loading('Uploading image...', { id: 'upload' });
        imageUrl = await uploadToImgBB(imageFile);
        toast.success('Image uploaded!', { id: 'upload' });
      }

      const menuRef = collection(db, 'restaurants', user.uid, 'menuItems');

      await addDoc(menuRef, {
        name,
        price: Number(price),
        category,
        imageUrl,
        createdAt: new Date()
      });

      toast.success('Item added successfully!');
      setName('');
      setPrice('');
      setCategory('Main Course');
      setImageFile(null);
      setImagePreview('');
      onClose();
    } catch (error) {
      console.error("Add item error:", error);
      toast.error("Failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 max-h- overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Add Menu Item</h2>
          <button onClick={onClose}>
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dish Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (Rs.)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
            >
              <option>Main Course</option>
              <option>Starter</option>
              <option>Dessert</option>
              <option>Drinks</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dish Image</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              {imagePreview? (
                <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg mb-2" />
              ) : (
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer text-red-600 font-semibold hover:underline"
              >
                {imagePreview? 'Change Image' : 'Choose Image'}
              </label>
              <p className="text-xs text-gray-400 mt-1">Max 32MB. JPG, PNG, WEBP</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-500 to-orange-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-70"
          >
            {loading? 'Adding...' : 'Add Item'}
          </button>
        </form>
      </div>
    </div>
  );
}