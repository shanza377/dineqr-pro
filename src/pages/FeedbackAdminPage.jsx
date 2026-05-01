import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Star, MessageSquare, Calendar, Filter, TrendingUp } from 'lucide-react';

export default function FeedbackAdminPage() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState([]);
  const [filterRating, setFilterRating] = useState('all'); 
  const [stats, setStats] = useState({
    avgRating: 0,
    totalReviews: 0,
    ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });

  useEffect(() => {
    fetchFeedbacks();
  }, [currentUser]);

  const fetchFeedbacks = async () => {
    if (!currentUser?.uid) return;
    setLoading(true);

    try {
      const q = query(
        collection(db, 'feedback'),
        where('restaurantId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
       ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));

      setFeedbacks(data);

      // Calculate stats
      if (data.length > 0) {
        const total = data.reduce((sum, f) => sum + f.rating, 0);
        const avg = total / data.length;
        
        const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        data.forEach(f => {
          breakdown[f.rating] = (breakdown[f.rating] || 0) + 1;
        });

        setStats({
          avgRating: avg,
          totalReviews: data.length,
          ratingBreakdown: breakdown
        });
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFeedbacks = feedbacks.filter(f => 
    filterRating === 'all' || f.rating === parseInt(filterRating)
  );

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Customer Feedback</h2>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <Star className="w-8 h-8" />
            <span className="text-3xl font-bold">{stats.avgRating.toFixed(1)}</span>
          </div>
          <p className="text-yellow-100">Average Rating</p>
          <div className="flex mt-2">{renderStars(Math.round(stats.avgRating))}</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <MessageSquare className="w-8 h-8" />
            <span className="text-3xl font-bold">{stats.totalReviews}</span>
          </div>
          <p className="text-blue-100">Total Reviews</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Rating Breakdown
          </h3>
          {[5, 4, 3, 2, 1].map(rating => (
            <div key={rating} className="flex items-center gap-2 mb-2">
              <span className="text-sm w-6">{rating}★</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-400 h-2 rounded-full"
                  style={{ 
                    width: `${stats.totalReviews > 0? (stats.ratingBreakdown[rating] / stats.totalReviews) * 100 : 0}%` 
                  }}
                />
              </div>
              <span className="text-sm text-gray-600 w-8">{stats.ratingBreakdown[rating]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        <Filter className="w-5 h-5 text-gray-500" />
        {['all', '5', '4', '3', '2', '1'].map(rating => (
          <button
            key={rating}
            onClick={() => setFilterRating(rating)}
            className={`px-4 py-2 rounded-lg font-semibold ${
              filterRating === rating
              ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {rating === 'all'? 'All' : `${rating}★`}
          </button>
        ))}
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        {filteredFeedbacks.length === 0? (
          <div className="bg-white rounded-xl p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No feedback yet</p>
          </div>
        ) : (
          filteredFeedbacks.map(feedback => (
            <div key={feedback.id} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex">{renderStars(feedback.rating)}</div>
                  <span className="font-bold text-lg">{feedback.rating}.0</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  {feedback.createdAt?.toLocaleDateString('en-PK')}
                </div>
              </div>
              
              <p className="text-gray-700 mb-3">{feedback.comment || 'No comment'}</p>
              
              <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t">
                <span>Order: {feedback.orderId?.slice(0, 8).toUpperCase()}</span>
                <span>Table: {feedback.tableId}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}