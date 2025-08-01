import { useMutation } from '@tanstack/react-query';
import { stopRepository } from '@/api/codeRunner';
import type { RepositoryStopResponse } from '@/api/codeRunner';

export const useCodeRunnerStop = (repositoryId?: number | string) => {
  return useMutation<RepositoryStopResponse, Error, void>({
    mutationFn: async () => {
      if (!repositoryId) throw new Error('repositoryId is required');
      return await stopRepository(repositoryId);
    },
  });
};
