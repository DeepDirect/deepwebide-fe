import React from 'react';
import Header from '@/components/organisms/Header/Header';
import InvitationLinkForm from '@/components/organisms/InvitationLinkForm/InvitationLinkForm';

import './InvitationLinkPage.scss';

const InvitationLinkPage: React.FC = () => {
  const handleSubmit = (code: string) => {
    console.log('입장 코드: ', code);
    // TODO: 입장 로직 구현
  };

  const handleGoHome = () => {
    // TODO: 홈으로 이동 로직 구현
  };

  return (
    // TODO: 로그인 된 유저만 접근 가능하도록 구현

    <div className="invitation-link-page">
      <Header variant="auth" />
      <main className="invitation-link-page__content">
        <InvitationLinkForm onSubmit={handleSubmit} onGoHome={handleGoHome} />
      </main>
      {/* <Loading /> */}
    </div>
  );
};

export default InvitationLinkPage;
