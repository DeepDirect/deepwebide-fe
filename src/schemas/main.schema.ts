import { z } from 'zod';

export const RepositoryItemSchema = z.object({
  repositoryId: z.number(),
  repositoryName: z.string(),
  ownerId: z.number(),
  ownerName: z.string(),
  shareLink: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  isFavorite: z.boolean(),
  isShared: z.boolean(),
});

export const RepositoryRequestSchema = z.object({
  currentPage: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
  totalElements: z.number(),
  repositories: z.array(RepositoryItemSchema),
});

export const RepositoryResponseSchema = z.object({
  page: z.number(),
  size: z.number(),
  liked: z.boolean(),
});

export type RepositoryItem = z.infer<typeof RepositoryItemSchema>;
export type RepositoryRequest = z.infer<typeof RepositoryRequestSchema>;
export type RepositoryResponse = z.infer<typeof RepositoryResponseSchema>;
