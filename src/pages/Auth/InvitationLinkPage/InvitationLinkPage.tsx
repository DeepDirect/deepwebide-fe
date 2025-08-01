import React from 'react';
import { useNavigate, useParams, useSearch } from '@tanstack/react-router';
import InvitationLinkForm from '@/components/organisms/InvitationLinkForm/InvitationLinkForm';
import { entrycodeApi } from '@/api/entrycode.api';

import './InvitationLinkPage.scss';
import { useToast } from '@/hooks/common/useToast';

const InvitationLinkPage: React.FC = () => {
  const navigator = useNavigate();
  const { repoId } = useParams({ strict: false });
  const search = useSearch({ strict: false });
  const repositoryName = search?.repositoryName;
  const toast = useToast();

  const handleSubmit = async (code: string) => {
    try {
      await entrycodeApi.postRepositoryEntryCode(repoId, code);
      toast.success('입장 코드 검증에 성공했습니다. 레포지토리에 참여합니다.');
      navigator({
        to: '/$repoId',
        params: { repoId },
      });
    } catch {
      toast.error('입장 코드 검증에 실패했습니다. 다시 시도해주세요.');
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
