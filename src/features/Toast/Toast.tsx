import * as Toast from '@radix-ui/react-toast';
import { useToastStore } from '@/stores/toastStore';
import styles from './Toast.module.scss';

const ToastUI = () => {
  const { open, type, message, duration, closeToast, showCloseButton } = useToastStore();

  return (
    <Toast.Provider swipeDirection="right" duration={duration}>
      <Toast.Root
        className={`${styles.Root} ${styles[type]}`}
        open={open}
        onOpenChange={closeToast}
      >
        <Toast.Title className={styles.Title}>{message}</Toast.Title>
        {showCloseButton && (
          <Toast.Close className={styles.close}>
            <button className={`${styles.Button}`} onClick={closeToast}>
              닫기
            </button>
          </Toast.Close>
        )}
      </Toast.Root>
      <Toast.Viewport className={styles.Viewport} />
    </Toast.Provider>
  );
};

export default ToastUI;
