import React, { useState } from 'react';
import PasswordInput from '@/components/atoms/Input/PasswordInput';
import InvitationFormActions from '@/components/molecules/InvitationFormActions/InvitationFormActions';

import './InvitationLinkForm.scss';

interface InvitationLinkFormProps {
  onSubmit?: (code: string) => void;
  onGoHome?: () => void;
}

const InvitationLinkForm: React.FC<InvitationLinkFormProps> = ({ onSubmit, onGoHome }) => {
  const [invitationCode, setInvitationCode] = useState('');

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(invitationCode);
    }
  };

  return (
    <div className="invitation-form">
      <div className="invitation-form__container">
        <div className="invitation-form__header">
          {/* 자물쇠 아이콘 */}
          <div className="invitation-form__icon">
            <img src="/src/assets/icons/lock.svg" alt="잠금 아이콘" />
          </div>

          <h1 className="invitation-form__title">입장 코드 입력</h1>

          {/* 프로젝트 정보 표시 */}
          <div className="invitation-form__project-info">
            <div className="invitation-form__project-icon" />
            <span className="invitation-form__project-name">project07</span>
          </div>
        </div>

        {/* 입력 폼 */}
        <div className="invitation-form__form">
          <div className="invitation-form__input-container">
            <PasswordInput
              placeholder="입장 코드를 입력하세요"
              value={invitationCode}
              onChange={e => setInvitationCode(e.target.value)}
              className="invitation-form__input"
            />
          </div>

          {/* 제출 버튼 & 홈으로 이동 버튼 */}
          <InvitationFormActions
            onSubmit={handleSubmit}
            onGoHome={onGoHome}
            submitDisabled={!invitationCode.trim()}
          />
        </div>
      </div>
    </div>
  );
};

export default InvitationLinkForm;
