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

export type CreateRepoRequest = z.infer<typeof CreateRepoRequestSchema>;
export type CreateRepoResponse = z.infer<typeof CreateRepoResponseSchema>;
