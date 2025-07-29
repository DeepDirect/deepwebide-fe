export type RepositoryQueryURL =
  | '/api/repositories/shared'
  | '/api/repositories/shared/me'
  | '/api/repositories/mine';

export type CreateRepoURL = '/api/repositories';

export type RepositoryURL = `/api/repositories/${number}`;

export type RepositoryEntryCodeURL = `/api/repositories/${number}/entrycode`;

export type RepositoryExitURL = `/api/repositories/${number}/exit`;

export type RepositoryFavoriteURL = `/api/repositories/${number}/favorite`;

export type RepositorySettingsURL = `/api/repositories/${number}/settings`;

export type KickedMemberURL = `/api/repositories/${number}/kicked`;
