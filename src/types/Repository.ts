export interface RepositoryItem {
  repositoryId: number;
  repositoryName: string;
  ownerId: number;
  ownerName: string;
  isShared: boolean;
  shareLink: string | null;
  createdAt: string;
  updatedAt: string;
  isFavorite: boolean;
}
