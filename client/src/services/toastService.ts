import { toast, type ToastOptions } from 'react-toastify';

const defaultOptions: ToastOptions = {
  position: 'top-right',
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: 'dark', // Default to dark theme for consistent look with app
};

export const toastService = {
  success: (message: string, options?: ToastOptions) => {
    toast.success(message, {
      ...defaultOptions,
      ...options,
      className: 'toast-success',
      progressClassName: 'toast-success-progress',
    });
  },
  info: (message: string, options?: ToastOptions) => {
    toast.info(message, {
      ...defaultOptions,
      ...options,
      className: 'toast-info',
      progressClassName: 'toast-info-progress',
    });
  },
  error: (message: string, options?: ToastOptions) => {
    toast.error(message, {
      ...defaultOptions,
      ...options,
      className: 'toast-error',
      progressClassName: 'toast-error-progress',
    });
  },
  warn: (message: string, options?: ToastOptions) => {
    toast.warn(message, {
      ...defaultOptions,
      ...options,
      className: 'toast-warn',
      progressClassName: 'toast-warn-progress',
    });
  },
};
