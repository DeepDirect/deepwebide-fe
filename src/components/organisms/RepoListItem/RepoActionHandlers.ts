import { useToast } from '@/hooks/common/useToast';
import { useClipboard } from '@/hooks/main/useClipboard';
import type { useRepoActions } from '@/hooks/main/useRepoActions';

export const useRepoActionHandlers = (
  actions: ReturnType<typeof useRepoActions>,
  repositoryRefetch: () => void
) => {
  const toast = useToast();
  const { copyToClipboard } = useClipboard();

  const handleRename = (newName: string) => {
    actions.rename.mutate(
      { repositoryName: newName },
      {
        onSuccess: () => {
          toast.success('레포지토리 이름이 변경되었습니다.');
          repositoryRefetch();
        },
        onError: error => toast.error(error.message),
      }
    );
  };

  const handleShareLinkCopy = (shareLink: string) => {
    copyToClipboard(shareLink, '공유 링크가 복사되었습니다.', '공유 링크 복사에 실패했습니다.');
  };

  const handleEntryCodeCopy = (entryCode?: string) => {
    if (!entryCode) {
      toast.error('입장코드를 불러올 수 없습니다.');
      return;
    }

    copyToClipboard(
      entryCode,
      '레포지토리 입장 코드가 복사되었습니다.',
      '레포지토리 입장 코드 복사에 실패했습니다.'
    );
  };

  return {
    handleRename,
    handleShareLinkCopy,
    handleEntryCodeCopy,
  };
};
