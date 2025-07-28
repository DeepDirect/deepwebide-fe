import React from 'react';
import { useNavigate, useParams, useSearch } from '@tanstack/react-router';
import InvitationLinkForm from '@/components/organisms/InvitationLinkForm/InvitationLinkForm';
import { entrycodeApi } from '@/api/entrycode.api';

import './InvitationLinkPage.scss';

const InvitationLinkPage: React.FC = () => {
  const navigator = useNavigate();
  const { repoId } = useParams({ strict: false });
  const search = useSearch({ strict: false });
  const repositoryName = search?.repositoryName;

  const handleSubmit = async (code: string) => {
    try {
      // 입장 코드 API 호출
      await entrycodeApi.postRepositoryEntryCode(repoId, code);

      // 성공 시 레포지토리로 이동
      // TODO - 메시지 토스트로 처리
      alert('공유 레포지토리에 참여되었습니다.');

      navigator({
        to: '/$repoId',
        params: { repoId },
      });
    } catch {
      // TODO - 에러 메시지 토스트로 처리
      alert('입장 코드 검증에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleGoHome = () => {
    navigator({ to: '/main' });
  };

  return (
    <div className="invitation-link-page">
      <main className="invitation-link-page__content">
        <InvitationLinkForm
          onSubmit={handleSubmit}
          onGoHome={handleGoHome}
          repositoryName={repositoryName}
        />
      </main>
    </div>
  );
};

export default InvitationLinkPage;
