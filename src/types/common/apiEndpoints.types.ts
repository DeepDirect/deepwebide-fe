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

export type RepositoryNewEntryCodeURL = `/api/repositories/${number}/new-entrycode`;

// auth 관룐 URL 타입
export type SignInURL = '/api/auth/signin';

export type SignOutURL = '/api/auth/signout';

export type SignUpURL = '/api/auth/signup';

export type EmailCheckURL = '/api/auth/email/check';

export type PhoneSendCodeURL = '/api/auth/phone/send-code';

export type PhoneVerifyCodeURL = '/api/auth/phone/verify-code';

export type FindIdURL = '/api/auth/email/find';

export type FindPasswordURL = '/api/auth/password/verify-user';

export type ChangePasswordURL = '/api/auth/password/reset';
