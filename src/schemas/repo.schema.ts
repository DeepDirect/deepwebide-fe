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

export type CreateRepoRequest = z.infer<typeof CreateRepoRequestSchema>;
export type CreateRepoResponse = z.infer<typeof CreateRepoResponseSchema>;
export type RepositoryRenameRequest = z.infer<typeof RepositoryRenameRequestSchema>;
export type RepositoryRenameResponse = z.infer<typeof RepositoryRenameResponseSchema>;
export type UpdateRepositoryShareStatusResponse = z.infer<
  typeof UpdateRepositoryShareStatusResponseSchema
>;
export type RepositoryEntrycodeResponse = z.infer<typeof RepositoryEntrycodeResponseSchema>;
