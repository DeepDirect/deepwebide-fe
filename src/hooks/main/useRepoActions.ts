import { useToast } from '@/hooks/common/useToast';
import useDeleteRepository from '@/hooks/main/useDeleteRepository';
import useGetRepositoryEntrycode from '@/hooks/common/useGetRepositoryEntrycode';
import useRepositoryExit from '@/hooks/common/useRepositoryExit';
import useRepositoryRename from '@/hooks/common/useRepositoryRename';
import useShareRepositoryStatus from '@/hooks/common/useShareRepositoryStatus';
import MainPageType from '@/constants/enums/MainPageType.enum';

export const useRepoActions = (
  repositoryId: number,
  pageType: MainPageType,
  repositoryRefetch: () => void
) => {
  const toast = useToast();

  const rename = useRepositoryRename(`/api/repositories/${repositoryId}`, {
    enabled: pageType !== MainPageType.SHARED_WITH_ME,
  });

  const shareStatus = useShareRepositoryStatus(`/api/repositories/${repositoryId}`, {
    onSuccess: res => {
      const message = res.data.isShared
        ? '공유 레포지토리로 전환되었습니다.'
        : '레포지토리 공유가 취소되었습니다.';
      toast.success(message);
      repositoryRefetch();
    },
    onError: error => toast.error(error.message),
    enabled: pageType !== MainPageType.SHARED_WITH_ME,
  });

  const deleteRepo = useDeleteRepository(`/api/repositories/${repositoryId}`, {
    onSuccess: () => {
      toast.success('레포지토리가 삭제되었습니다.');
      repositoryRefetch();
    },
    onError: error => toast.error(error.message),
    enabled: pageType === MainPageType.PRIVATE_REPO,
  });

  const exit = useRepositoryExit(`/api/repositories/${repositoryId}/exit`, {
    onSuccess: () => {
      toast.success('공유 레포지토리에서 퇴장했습니다.');
      repositoryRefetch();
    },
    onError: error => toast.error(error.message),
    enabled: pageType === MainPageType.SHARED_WITH_ME,
  });

  const entryCode = useGetRepositoryEntrycode(`/api/repositories/${repositoryId}/entrycode`, {
    enabled: pageType === MainPageType.SHARED_BY_ME,
  });

  return {
    rename,
    shareStatus,
    deleteRepo,
    exit,
    entryCode,
  };
};
