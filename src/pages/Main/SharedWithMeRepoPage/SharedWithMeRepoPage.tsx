import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

import Toggle from '@/components/atoms/Toggle/Toggle';
import Pagination from '@/components/molecules/Pagination/Pagination';
import RepoListItem from '@/components/organisms/RepoListItem/RepoListItem';

import styles from './SharedWithMeRepoPage.module.scss';

const tempList = [
  {
    repositoryId: 1,
    repositoryName: '공유받은 프로젝트1',
    ownerId: 5,
    ownerName: '고통받는 개발자',
    isShared: false,
    shareLink: null,
    createdAt: '2025-07-18T13:10:00Z',
    updatedAt: '2025-07-22T13:10:00Z',
    isFavorite: true,
  },
  {
    repositoryId: 2,
    repositoryName: '공유받은 프로젝트2',
    ownerId: 5,
    ownerName: '고통받는 개발자',
    isShared: false,
    shareLink: null,
    createdAt: '2025-07-18T13:10:00Z',
    updatedAt: '2025-07-22T13:10:00Z',
    isFavorite: false,
  },
  {
    repositoryId: 3,
    repositoryName: '공유받은 프로젝트3',
    ownerId: 5,
    ownerName: '고통받는 개발자',
    isShared: false,
    shareLink: null,
    createdAt: '2025-07-19T08:00:00Z',
    updatedAt: '2025-07-22T13:20:00Z',
    isFavorite: true,
  },
  {
    repositoryId: 4,
    repositoryName: '공유받은 프로젝트4',
    ownerId: 5,
    ownerName: '고통받는 개발자',
    isShared: false,
    shareLink: null,
    createdAt: '2025-07-19T08:00:00Z',
    updatedAt: '2025-07-22T13:20:00Z',
    isFavorite: false,
  },
  {
    repositoryId: 5,
    repositoryName: '공유받은 프로젝트5',
    ownerId: 5,
    ownerName: '고통받는 개발자',
    isShared: false,
    shareLink: null,
    createdAt: '2025-07-20T11:00:00Z',
    updatedAt: '2025-07-22T14:00:00Z',
    isFavorite: true,
  },
  {
    repositoryId: 6,
    repositoryName: '공유받은 프로젝트6',
    ownerId: 5,
    ownerName: '고통받는 개발자',
    isShared: false,
    shareLink: null,
    createdAt: '2025-07-20T11:00:00Z',
    updatedAt: '2025-07-22T14:00:00Z',
    isFavorite: false,
  },
  {
    repositoryId: 7,
    repositoryName: '공유받은 프로젝트7',
    ownerId: 5,
    ownerName: '고통받는 개발자',
    isShared: false,
    shareLink: null,
    createdAt: '2025-07-20T14:30:00Z',
    updatedAt: '2025-07-22T14:30:00Z',
    isFavorite: false,
  },
]; // TODO: api 연동 후 제거

const isSharedMe = true;

const SharedWithMeRepoPage = () => {
  const navigate = useNavigate();
  const [pagination, setPagination] = useState({
    total: 10,
    current: 1,
    pageSize: 5,
  }); // TODO: api 연동 후 받은 데이터로 변경

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, current: page }));
  };
  const handleFavoriteClick = (id: number) => {
    console.log(`Favorite clicked for repository ID: ${id}`);
  };
  const handleRepoClick = (repoId: number) => {
    navigate({ to: '/$repoId', params: { repoId } });
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.topWrapper}>
        <h1 className={styles.title}>공유받은 레포</h1>

        <div className={styles.buttonWrapper}>
          <Toggle variant="favorite" />
        </div>
      </div>

      <div className={styles.repositoriesWrapper}>
        {tempList.map(repo => (
          <RepoListItem
            key={repo.repositoryId}
            isSharedMe={isSharedMe}
            info={repo}
            handleFavoriteClick={handleFavoriteClick}
            handleRepoClick={handleRepoClick}
          />
        ))}
      </div>

      <div className={styles.paginationWrapper}>
        <Pagination
          maxVisiblePages={5}
          totalPages={pagination.total}
          currentPage={pagination.current}
          handlePageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default SharedWithMeRepoPage;
