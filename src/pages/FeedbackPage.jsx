import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Star, Send } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function FeedbackPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [order, setOrder] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const orderDoc = await getDoc(doc(db, 'orders', orderId));
        if (orderDoc.exists()) {
          const orderData = orderDoc.data();
          if (orderData.feedbackSubmitted) {
            setSubmitted(true);
          }
          setOrder(orderData);
        } else {
          toast.error('Order not found');
        }
      } catch (error) {
        toast.error('Error loading order');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  const submitFeedback = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    try {
      // Save feedback
      await addDoc(collection(db, 'feedback'), {
        orderId,
        restaurantId: order.restaurantId,
        rating,
        comment,
        createdAt: new Date(),
        tableId: order.tableId
      });

      // Mark order as feedback submitted
      await updateDoc(doc(db, 'orders', orderId), {
        feedbackSubmitted: true
      });

      setSubmitted(true);
      toast.success('Thank you for your feedback! 🙏');
    } catch (error) {
      toast.error('Failed to submit feedback');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-6">
        <Toaster position="top-center" />
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
          <p className="text-gray-600 mb-6">Your feedback helps us improve</p>

          {rating >= 4 && (
            <a
              href="https://g.page/r/YOUR_GOOGLE_PLACE_ID/review" // 👈 Apna Google link yahan
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold inline-block hover:bg-blue-600"
            >
              Leave us a Google Review ⭐
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-6">
      <Toaster position="top-center" />
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-center mb-2">Rate Your Experience</h2>
        <p className="text-gray-500 text-center mb-6">Table {order?.tableId}</p>

        {/* Stars */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`w-12 h-12 ${
                  star <= (hover || rating)
                   ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Comment */}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell us about your experience... (optional)"
          className="w-full border-2 border-gray-200 rounded-lg p-3 mb-6 focus:border-orange-500 outline-none resize-none"
          rows="4"
        />

        <button
          onClick={submitFeedback}
          className="w-full bg-orange-500 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-orange-600"
        >
          <Send className="w-5 h-5" /> Submit Feedback
        </button>
      </div>
    </div>
  );
}