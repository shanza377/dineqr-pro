import React, { useState } from 'react';
import { createUserWithEmailAndPassword, sendEmailVerification, getAuth, onAuthStateChanged, reload } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { UtensilsCrossed, Mail, Lock, Store } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSignup() {
  const auth = getAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);

    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Send verification email
      await sendEmailVerification(userCredential.user);
      toast.success('Verification email sent! Check your inbox.');

      // 3. Create restaurant document in Firestore
      await setDoc(doc(db, 'restaurants', user.uid), {
        restaurantName,
        email,
        ownerId: user.uid,
        logoUrl: '',
        emailVerified: false,
        createdAt: new Date()
      });

      toast.success('Account created! Please verify your email.');
      navigate('/admin/dashboard');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Email already registered. Please login.');
      } else {
        toast.error(error.message);
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dine-50 to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md border-gray-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-dine-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UtensilsCrossed className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Start your digital menu journey</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Restaurant Name</label>
            <div className="relative">
              <Store className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-dine-500 focus:border-transparent outline-none"
                placeholder="e.g., Shanzay's Café"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-dine-500 focus:border-transparent outline-none"
                placeholder="you@restaurant.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-dine-500 focus:border-transparent outline-none"
                placeholder="Minimum 6 characters"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-dine-500 to-orange-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 cursor-pointer"
          >
            {loading? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          Already have an account?{' '}
          <Link to="/admin/login" className="text-dine-600 font-semibold hover:text-dine-700">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}