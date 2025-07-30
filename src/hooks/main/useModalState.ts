import { useState } from 'react';

interface ModalState {
  changeRepoName: boolean;
  deleteRepoAlert: boolean;
  shareMyRepoAlertDialog: boolean;
  cancelMyRepoShareAlert: boolean;
  leaveSharedRepoAlertDialog: boolean;
}

export const useModalState = () => {
  const [modals, setModals] = useState<ModalState>({
    changeRepoName: false,
    deleteRepoAlert: false,
    shareMyRepoAlertDialog: false,
    cancelMyRepoShareAlert: false,
    leaveSharedRepoAlertDialog: false,
  });

  const toggleModal = (modalName: keyof ModalState) => {
    setModals(prev => ({
      ...prev,
      [modalName]: !prev[modalName],
    }));
  };

  return { modals, toggleModal };
};
