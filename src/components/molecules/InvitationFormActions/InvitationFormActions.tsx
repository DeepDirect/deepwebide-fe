import React from 'react';
import EntryCodeSubmitButton from '@/components/molecules/EntryCodeSubmitButton/EntryCodeSubmitButton';

import './InvitationFormActions.scss';

interface InvitationFormActionsProps {
  onSubmit?: () => void;
  onGoHome?: () => void;
}

const InvitationFormActions: React.FC<InvitationFormActionsProps> = ({ onSubmit, onGoHome }) => {
  return (
    <>
      <div className="invitation-form-actions">
        <EntryCodeSubmitButton onClick={onSubmit}>입장하기</EntryCodeSubmitButton>

        <button type="button" className="invitation-form-actions__home-link" onClick={onGoHome}>
          홈으로 돌아가기
        </button>
      </div>
    </>
  );
};

export default InvitationFormActions;
