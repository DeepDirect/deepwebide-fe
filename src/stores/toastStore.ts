import { create } from 'zustand';

type ToastType = 'success' | 'error' | 'warning' | 'info';

type propsType = {
  message: string;
  type?: ToastType;
  duration?: number;
  showCloseButton?: boolean;
};

interface ToastState {
  open: boolean;
  type: ToastType;
  message: string;
  duration: number;
  showCloseButton?: boolean;
  showToast: (props: propsType) => void;
  closeToast: () => void;
}

export const useToastStore = create<ToastState>(set => ({
  type: 'info',
  open: false,
  message: '',
  duration: 3000,
  showCloseButton: false,
  showToast: ({ message, type = 'info', duration = 3000, showCloseButton = false }) => {
    set({ open: false });

    setTimeout(() => {
      set({ open: true, message, type, duration, showCloseButton });
    }, 50); // 애니메이션을 위한 setTimeout
  },
  closeToast: () => set({ open: false }),
}));
