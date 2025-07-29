import { z } from 'zod';

export const CreateRepoRequestSchema = z.object({
  repositoryName: z.string(),
  repositoryType: z.enum({ SPRING_BOOT: 'SPRING_BOOT', REACT: 'REACT', FAST_API: 'FAST_API' }),
});

export const CreateRepoResponseSchema = z.object({
  repositoryId: z.number(),
  repositoryName: z.string(),
  ownerId: z.number(),
  ownerName: z.string(),
  createdAt: z.string(),
});

export const RepositoryRenameRequestSchema = z.object({
  repositoryName: z.string(),
});

export const RepositoryRenameResponseSchema = z.object({
  repositoryId: z.number(),
  repositoryName: z.string(),
  ownerId: z.number(),
  ownerName: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const UpdateRepositoryShareStatusResponseSchema = z.object({
  repositoryId: z.number(),
  repositoryName: z.string(),
  ownerId: z.number(),
  ownerName: z.string(),
  shareLink: z.string().url(),
  createdAt: z.string(),
  updatedAt: z.string(),
  isFavorite: z.boolean(),
  isShared: z.boolean(),
});

export const RepositoryEntrycodeResponseSchema = z.object({
  repositoryId: z.number(),
  repositoryName: z.string(),
  ownerId: z.number(),
  ownerName: z.string(),
  shareLink: z.string(),
  entryCode: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  isShared: z.boolean(),
});

export const RepositoryFavoriteResponseSchema = z.object({
  message: z.string(),
  isFavorite: z.boolean(),
});

export type CreateRepoRequest = z.infer<typeof CreateRepoRequestSchema>;
export type CreateRepoResponse = z.infer<typeof CreateRepoResponseSchema>;
export type RepositoryRenameRequest = z.infer<typeof RepositoryRenameRequestSchema>;
export type RepositoryRenameResponse = z.infer<typeof RepositoryRenameResponseSchema>;
export type UpdateRepositoryShareStatusResponse = z.infer<
  typeof UpdateRepositoryShareStatusResponseSchema
>;
export type RepositoryEntrycodeResponse = z.infer<typeof RepositoryEntrycodeResponseSchema>;
export type RepositoryFavoriteResponse = z.infer<typeof RepositoryFavoriteResponseSchema>;

// 환경설정 관련 스키마 정의 추가
export const RepositoryMemberSchema = z.object({
  userId: z.number(),
  nickname: z.string(),
  profileImageUrl: z.string(),
  role: z.enum(['OWNER', 'MEMBER']),
});

export const RepositorySettingsDataSchema = z.object({
  repositoryId: z.number(),
  repositoryName: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  shareLink: z.string(),
  members: z.array(RepositoryMemberSchema),
  isShared: z.boolean(),
});

export const RepositorySettingsResponseSchema = z.object({
  status: z.number(),
  message: z.string(),
  data: RepositorySettingsDataSchema,
});

export type RepositoryMember = z.infer<typeof RepositoryMemberSchema>;
export type RepositorySettingsData = z.infer<typeof RepositorySettingsDataSchema>;
export type RepositorySettingsResponse = z.infer<typeof RepositorySettingsResponseSchema>;

// 멤버 추방
export const KickedMemberResponse = z.object({
  kickedUserId: z.number(),
});

export const ResponseDtoKickedMemberResponse = z.object({
  status: z.number(),
  message: z.string(),
  data: KickedMemberResponse.nullable(),
});

export type KickedMemberResponseType = z.infer<typeof KickedMemberResponse>;
export type ResponseDtoKickedMemberResponseType = z.infer<typeof ResponseDtoKickedMemberResponse>;
