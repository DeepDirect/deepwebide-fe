export type RepositoryQueryURL =
  | '/api/repositories/shared'
  | '/api/repositories/shared/me'
  | '/api/repositories/mine';

export type CreateRepoURL = '/api/repositories';

export type RepositoryRenameURL = `/api/repositories/${number}`;
