import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Download, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

export default function QRCodeModal({ isOpen, onClose, restaurantId, table }) {
  if (!isOpen || !table) return null;

  // QR URL: /menu/restaurantId/tableId
  const menuUrl = `${window.location.origin}/menu/${restaurantId}/${table.id}`;

  const downloadQR = () => {
    const svg = document.getElementById('table-qr-code');
    if (!svg) return toast.error('QR code not found');

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      
      const downloadLink = document.createElement('a');
      downloadLink.download = `Table-${table.id}-QR.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      toast.success('QR Code downloaded!');
    };
    
    img.onerror = () => toast.error('Failed to generate QR');
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const copyLink = () => {
    navigator.clipboard.writeText(menuUrl);
    toast.success('Link copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Table {table.id} QR</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col items-center space-y-4">
          <div className="bg-white p-4 rounded-xl border-2 border-gray-200 shadow-sm">
            <QRCodeSVG
              id="table-qr-code"
              value={menuUrl}
              size={256}
              level="H"
              includeMargin={true}
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>
          
          <div className="text-center w-full">
            <p className="text-sm text-gray-600 mb-2">
              Scan to view menu for Table {table.id}
            </p>
            
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <p className="text-xs text-gray-500 break-all">
                {menuUrl}
              </p>
            </div>
          </div>

          <div className="w-full space-y-3">
            <button
              onClick={downloadQR}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition"
            >
              <Download className="w-5 h-5" />
              Download QR Code
            </button>

            <button
              onClick={copyLink}
              className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
            >
              <Copy className="w-5 h-5" />
              Copy Menu Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}