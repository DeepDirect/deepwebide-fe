import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

import FileIcon from '@/assets/icons/file.svg?react';

import useGetRepository from '@/hooks/useGetRepository';

import Button from '@/components/atoms/Button/Button';
import Toggle from '@/components/atoms/Toggle/Toggle';
import Pagination from '@/components/molecules/Pagination/Pagination';
import RepoListItem from '@/components/organisms/RepoListItem/RepoListItem';

import CreateRepoModal from '@/features/Modals/CreateRepoModal/CreateRepoModal';

import MainPageType from '@/constants/enums/MainPageType.enum';

import type { RepositoryItem } from '@/schemas/main.schema';
import type { RepositoryQueryURL } from '@/types/main.types';

import styles from './PrivateRepoPage.module.scss';

type page = {
  maxVisiblePages: number; // 5
  page: number | null;
  current: number | null;
  size: number; // 7
  total: number | null;
};

const url: RepositoryQueryURL = '/api/repositories/mine';

const PrivateRepoPage = () => {
  const navigate = useNavigate();
  const [pagination, setPagination] = useState<page>({
    maxVisiblePages: 5,
    page: null, // 1부터 시작
    current: 1, // 현재 페이지
    size: 7, // 아이템 개수
    total: null, // 총 페이지 수
  });
  const [repositories, setRepositories] = useState<RepositoryItem[] | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  // NOTE: 레포 생성 모달 열림 여부
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data, isSuccess, isError, error, refetch } = useGetRepository(url, {
    page: (pagination.page ?? 1) - 1,
    size: pagination.current ?? 7,
    liked: isLiked,
  });

  // 성공
  useEffect(() => {
    if (isSuccess && data) {
      setRepositories(data.repositories);
      setPagination(prev => ({
        ...prev,
        total: data.totalPages,
      }));
    }
  }, [isSuccess, data]);

  // 실패
  useEffect(() => {
    if (isError && error) {
      console.error(error);
    }
  }, [isError, error]);

  // 페이지
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, current: page }));
    refetch();
  };

  // 레포 좋아요
  const handleFavoriteClick = (id: number) => {
    console.log(`Favorite clicked for repository ID: ${id}`);
  };

  // 좋아요 필터
  const handleLikChange = () => {
    setIsLiked(!isLiked);
    refetch();
  };

  const handleRepoClick = (repoId: number) => {
    navigate({ to: '/$repoId', params: { repoId } });
  };

  // 새 레포지토리 생성 버튼 클릭
  const handleCreateRepoClick = () => {
    setIsCreateModalOpen(true);
  };

  // 레포지토리 생성 확인
  const handleCreateRepoConfirm = (data: { name: string; projectType: string }) => {
    console.log('새 레포지토리 생성:', data);
    // TODO: API 호출하여 레포지토리 생성 기능 API 연결 필요
    setIsCreateModalOpen(false);
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
          />
        ))}
      </div>

      <div className={styles.paginationWrapper}>
        <Pagination
          maxVisiblePages={pagination.total ?? 0}
          totalPages={pagination.total ?? 1}
          currentPage={pagination.current ?? 1}
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
