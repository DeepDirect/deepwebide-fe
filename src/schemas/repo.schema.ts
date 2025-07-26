import { z } from 'zod';

export const CreateRepoRequestSchema = z.object({
  repositoryName: z.string(),
  repositoryType: z.string(),
});

export const CreateRepoResponseSchema = z.object({
  repositoryId: z.number(),
  repositoryName: z.string(),
  ownerId: z.number(),
  ownerName: z.string(),
  createdAt: z.string(),
});

export type CreateRepoRequest = z.infer<typeof CreateRepoRequestSchema>;
export type CreateRepoResponse = z.infer<typeof CreateRepoResponseSchema>;
