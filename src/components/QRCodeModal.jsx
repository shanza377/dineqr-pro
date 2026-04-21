import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Download } from 'lucide-react';
import toast from 'react-hot-toast';

export default function QRCodeModal({ isOpen, onClose, userId, restaurantName }) {
  if (!isOpen) return null;

  // Customer menu ka URL - baad me ye page banayein ge
  const menuUrl = `${window.location.origin}/menu/${userId}`;

  const downloadQR = () => {
    const svg = document.getElementById('restaurant-qr-code');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      
      const downloadLink = document.createElement('a');
      downloadLink.download = `${restaurantName || 'restaurant'}-qr.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      toast.success('QR Code downloaded!');
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Your Restaurant QR</h2>
          <button onClick={onClose}>
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="flex flex-col items-center space-y-4">
          <div className="bg-white p-4 rounded-xl border-2 border-gray-200">
            <QRCodeSVG
              id="restaurant-qr-code"
              value={menuUrl}
              size={256}
              level="H"
              includeMargin={true}
            />
          </div>
          
          <p className="text-sm text-gray-600 text-center">
            Customers can scan this QR to view your menu
          </p>
          
          <p className="text-xs text-gray-500 break-all text-center px-4">
            {menuUrl}
          </p>

          <button
            onClick={downloadQR}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-dine-500 to-orange-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition"
          >
            <Download className="w-5 h-5" />
            Download QR Code
          </button>
        </div>
      </div>
    </div>
  );
}