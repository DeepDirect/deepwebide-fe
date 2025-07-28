import { apiClient } from './client';

export interface Repository {
  repositoryId: number;
  repositoryName: string;
  ownerId: number;
  ownerName: string;
  shareLink: string | null;
  createdAt: string;
  updatedAt: string;
  isShared: boolean;
}

export interface RepositoryAccessResponse {
  status: number;
  message: string;
  data: {
    access: boolean;
    repository: Repository;
  };
}

export const entrycodeApi = {
  /**
   * 레포지토리 입장 권한 확인
   */
  getRepositoryAccessibility: (repositoryId: string) => {
    return apiClient.get<RepositoryAccessResponse>(`/api/repositories/${repositoryId}`);
  },

  /**
   * 레포지토리 입장 코드 검증
   */
  postRepositoryEntryCode: (repositoryId: string, entryCode: string) => {
    return apiClient.post(`/api/repositories/${repositoryId}/entrycode`, { entryCode });
  },
};
