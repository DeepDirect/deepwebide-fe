import React from 'react';
import EntryCodeSubmitButton from '@/components/molecules/EntryCodeSubmitButton/EntryCodeSubmitButton';

import './InvitationFormActions.scss';

interface InvitationFormActionsProps {
  onSubmit?: () => void;
  onGoHome?: () => void;
  submitDisabled?: boolean;
}

const InvitationFormActions: React.FC<InvitationFormActionsProps> = ({
  onSubmit,
  onGoHome,
  submitDisabled = false,
}) => {
  return (
    <div className="invitation-form-actions">
      <EntryCodeSubmitButton onClick={onSubmit} disabled={submitDisabled}>
        입장하기
      </EntryCodeSubmitButton>

      <button type="button" className="invitation-form-actions__home-link" onClick={onGoHome}>
        홈으로 돌아가기
      </button>
    </div>
  );
};

export default InvitationFormActions;
