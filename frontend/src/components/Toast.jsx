import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`}>
      {type === 'success' ? <CheckCircle size={20} color="var(--success)" /> : <AlertCircle size={20} color="var(--danger)" />}
      <span>{message}</span>
    </div>
  );
};

export default Toast;
