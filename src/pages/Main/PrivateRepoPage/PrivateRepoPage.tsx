import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

import FileIcon from '@/assets/icons/file.svg?react';

import useCreateRepository from '@/hooks/main/useCreateRepository';
import useGetRepository from '@/hooks/main/useGetRepository';
import { useToast } from '@/hooks/common/useToast';
import useRepositoryFavorite from '@/hooks/main/useRepositoryFavorite';

import Button from '@/components/atoms/Button/Button';
import Toggle from '@/components/atoms/Toggle/Toggle';
import Pagination from '@/components/molecules/Pagination/Pagination';
import RepoListItem from '@/components/organisms/RepoListItem/RepoListItem';

import CreateRepoModal from '@/features/Modals/CreateRepoModal/CreateRepoModal';

import MainPageType from '@/constants/enums/MainPageType.enum';
import type RepositoryType from '@/constants/enums/RepositoryType.enum';

import type { RepositoryItem } from '@/schemas/repo.schema';
import type { CreateRepoURL, RepositoryQueryURL } from '@/types/common/apiEndpoints.types';
import type { Page } from '@/types/common/page.types';

import styles from './PrivateRepoPage.module.scss';

const getRepoURL: RepositoryQueryURL = '/api/repositories/mine';
const postRepoURL: CreateRepoURL = '/api/repositories';

const PrivateRepoPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [pagination, setPagination] = useState<Page>({
    maxVisiblePages: 5,
    page: null, // 1부터 시작
    current: 1, // 현재 페이지
    size: 7, // 아이템 개수
    total: null, // 총 페이지 수
  });
  const [repositories, setRepositories] = useState<RepositoryItem[] | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); // NOTE: 레포 생성 모달 열림 여부
  const {
    data,
    isSuccess,
    isError,
    error,
    refetch: repositoryRefetch,
  } = useGetRepository(getRepoURL, {
    page: (pagination.current || 1) - 1,
    size: pagination.size || 7,
    liked: isLiked,
  });
  const createMutation = useCreateRepository(postRepoURL);
  const { mutate: updateFavorite } = useRepositoryFavorite();

  // 성공
  useEffect(() => {
    if (isSuccess && data.data) {
      setRepositories(data?.data.repositories);
      setPagination(prev => ({
        ...prev,
        total: data?.data?.totalPages,
      }));
    }
  }, [isSuccess, data]);

  // 실패
  useEffect(() => {
    if (isError && error) {
      toast.error(error.message);
    }
  }, [isError, error, toast]);

  // 페이지
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, current: page }));
    repositoryRefetch();
  };

  // 레포 좋아요
  const handleFavoriteClick = (id: number) => {
    const targetRepo = repositories?.find(repo => repo.repositoryId === id);

    updateFavorite(id, {
      onSuccess: () => {
        setRepositories(
          prev =>
            prev?.map(repo =>
              repo.repositoryId === id ? { ...repo, isFavorite: !repo.isFavorite } : repo
            ) ?? null
        );
        repositoryRefetch();

        if (targetRepo) {
          const action = targetRepo.isFavorite ? '즐겨찾기에서 제거' : '즐겨찾기에 추가';
          toast.info(`개인 레포지토리 "${targetRepo.repositoryName}" 가 \n ${action}되었습니다.`);
        }
      },
      onError: error => {
        toast.error(error.message);
      },
    });
  };

  // 좋아요 필터
  const handleLikChange = () => {
    setIsLiked(!isLiked);
    repositoryRefetch();
  };

  const handleRepoClick = (repoId: number) => {
    navigate({ to: '/$repoId', params: { repoId } });
  };

  // 새 레포지토리 생성 버튼 클릭
  const handleCreateRepoClick = () => {
    setIsCreateModalOpen(true);
  };

  // 레포지토리 생성 확인
  const handleCreateRepoConfirm = (data: {
    repositoryName: string;
    repositoryType: RepositoryType;
  }) => {
    setIsCreateModalOpen(false);

    createMutation.mutate(data, {
      onSuccess: () => {
        toast.success('새 레포지토리가 생성되었습니다.');
        repositoryRefetch();
      },
      onError: error => {
        toast.error(error.message);
      },
    });
  };

  // 레포지토리 생성 취소
  const handleCreateRepoCancel = () => {
    setIsCreateModalOpen(false);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.topWrapper}>
        <h1 className={styles.title}>개인 레포</h1>

        <div className={styles.buttonWrapper}>
          <Toggle variant="favorite" onCheckedChange={handleLikChange} />
          <Button className={styles.repoButton} onClick={handleCreateRepoClick}>
            <FileIcon className={styles.iconImage} />새 레포지토리 생성
          </Button>
        </div>
      </div>

      <div className={styles.repositoriesWrapper}>
        {repositories?.map(repo => (
          <RepoListItem
            key={repo.repositoryId}
            info={repo}
            pageType={MainPageType.PRIVATE_REPO}
            handleFavoriteClick={handleFavoriteClick}
            handleRepoClick={handleRepoClick}
            repositoryRefetch={repositoryRefetch}
          />
        ))}
      </div>

      <div className={styles.paginationWrapper}>
        <Pagination
          maxVisiblePages={pagination.maxVisiblePages || 1}
          totalPages={pagination.total || 1}
          currentPage={pagination.current || 1}
          handlePageChange={handlePageChange}
        />
      </div>

      {/* 레포지토리 생성 모달 */}
      <CreateRepoModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onConfirm={handleCreateRepoConfirm}
        onCancel={handleCreateRepoCancel}
      />
    </div>
  );
};

export default PrivateRepoPage;
