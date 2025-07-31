import { useToast } from '@/hooks/common/useToast';

export const useClipboard = () => {
  const toast = useToast();

  const copyToClipboard = async (text: string, successMessage: string, errorMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(successMessage);
      return true;
    } catch {
      toast.error(errorMessage);
      return false;
    }
  };

  return { copyToClipboard };
};
