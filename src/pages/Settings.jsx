import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { updateEmail, updatePassword, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const IMGBB_API_KEY = 'f56d3452792b38bb6ef9144c9e1c86ea'; // Paste your ImgBB API key here

export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const [restaurantName, setRestaurantName] = useState('');
  const [email, setEmail] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [currentLogo, setCurrentLogo] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // User ka data fetch karo
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setEmail(currentUser.email);

        const restaurantDoc = await getDoc(doc(db, 'restaurants', currentUser.uid));
        if (restaurantDoc.exists()) {
          const data = restaurantDoc.data();
          setRestaurantName(data.restaurantName || '');
          setCurrentLogo(data.logoUrl || '');
          setLogoPreview(data.logoUrl || '');
        }
      } else {
        navigate('/admin/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
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
    if (data.success) return data.data.url;
    throw new Error('Logo upload failed');
  };

  const handleSave = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    let logoUrl = currentLogo;

    // 1. Logo upload
    if (logoFile) {
      toast.loading('Uploading logo...', { id: 'logo' });
      logoUrl = await uploadToImgBB(logoFile);
      toast.success('Logo uploaded!', { id: 'logo' });
    }

    // 2. use SetDoc with merge to update restaurant profile
    await setDoc(doc(db, 'restaurants', user.uid), {
      restaurantName,
      logoUrl,
      email,
      ownerId: user.uid,
      updatedAt: new Date()
    }, { merge: true }); 

    // 3. Email update 
    if (email!== user.email) {
      await updateEmail(user, email);
      toast.success('Email updated!');
    }

    // 4. Password update 
    if (newPassword) {
      if (newPassword!== confirmPassword) {
        throw new Error('Passwords do not match');
      }
      if (newPassword.length < 6) {
        throw new Error('Password must be 6+ characters');
      }
      await updatePassword(user, newPassword);
      toast.success('Password updated!');
      setNewPassword('');
      setConfirmPassword('');
    }

    toast.success('Profile updated successfully!');
    setCurrentLogo(logoUrl);
  } catch (error) {
    toast.error(error.message);
  }

  setLoading(false);
};


  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Restaurant Settings</h1>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
                  {logoPreview? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg font-medium text-gray-700"
                  >
                    Change Logo
                  </label>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                </div>
              </div>
            </div>

            {/* Restaurant Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
              <input
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-dine-500 outline-none"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-dine-500 outline-none"
                required
              />
            </div>

            <div className="border-t pt-6">
              <h3 className="font-bold text-gray-900 mb-4">Change Password</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-dine-500 outline-none"
                    placeholder="Leave blank to keep current"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-dine-500 outline-none"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-dine-500 to-orange-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-70 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {loading? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}