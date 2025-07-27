import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

import useGetRepository from '@/hooks/useGetRepository';

import Toggle from '@/components/atoms/Toggle/Toggle';
import Pagination from '@/components/molecules/Pagination/Pagination';
import RepoListItem from '@/components/organisms/RepoListItem/RepoListItem';

import MainPageType from '@/constants/enums/MainPageType.enum';

import type { RepositoryItem } from '@/schemas/main.schema';
import type { RepositoryQueryURL } from '@/types/apiEndpoints.types';
import type { Page } from '@/types/page.types';

import styles from './SharedByMeRepoPage.module.scss';

const getRepoURL: RepositoryQueryURL = '/api/repositories/shared';

const SharedByMeRepoPage = () => {
  const navigate = useNavigate();
  const [pagination, setPagination] = useState<Page>({
    maxVisiblePages: 5,
    page: null, // 1부터 시작
    current: 1, // 현재 페이지
    size: 7, // 아이템 개수
    total: null, // 총 페이지 수
  });
  const [repositories, setRepositories] = useState<RepositoryItem[] | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const {
    data,
    isSuccess,
    refetch,
    // isLoading
  } = useGetRepository(getRepoURL, {
    page: (pagination.page || 1) - 1,
    size: pagination.current || 7,
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

  return (
    <div className={styles.wrapper}>
      <div className={styles.topWrapper}>
        <h1 className={styles.title}>공유한 레포</h1>

        <div className={styles.buttonWrapper}>
          <Toggle variant="favorite" onCheckedChange={handleLikChange} />
        </div>
      </div>

      <div className={styles.repositoriesWrapper}>
        {repositories?.map(repo => (
          <RepoListItem
            key={repo.repositoryId}
            info={repo}
            pageType={MainPageType.SHARED_BY_ME}
            handleFavoriteClick={handleFavoriteClick}
            handleRepoClick={handleRepoClick}
          />
        ))}
      </div>

      <div className={styles.paginationWrapper}>
        <Pagination
          maxVisiblePages={pagination.total || 1}
          totalPages={pagination.total || 1}
          currentPage={pagination.current || 1}
          handlePageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default SharedByMeRepoPage;
