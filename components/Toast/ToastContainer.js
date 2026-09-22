'use client';

import { CheckCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function ToastContainer() {
  const { toasts } = useCart();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className="toast toast-success">
          <CheckCircle size={18} className="toast-icon" />
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
