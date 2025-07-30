import { useToastStore } from '@/stores/toastStore';

export const useToast = () => {
  const { showToast } = useToastStore();

  return {
    success: (message: string, duration?: number, showCloseButton?: boolean) =>
      showToast({ message, type: 'success', duration, showCloseButton }),
    error: (message: string, duration?: number, showCloseButton?: boolean) =>
      showToast({ message, type: 'error', duration, showCloseButton }),
    warning: (message: string, duration?: number, showCloseButton?: boolean) =>
      showToast({ message, type: 'warning', duration, showCloseButton }),
    info: (message: string, duration?: number, showCloseButton?: boolean) =>
      showToast({ message, type: 'info', duration, showCloseButton }),
  };
};
