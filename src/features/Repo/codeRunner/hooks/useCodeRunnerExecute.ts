import { useMutation } from '@tanstack/react-query';
import { executeRepository } from '@/api/codeRunner';
import type { RepositoryExecuteResponse } from '@/api/codeRunner';

export const useCodeRunnerExecute = (repositoryId?: number | string) => {
  return useMutation<RepositoryExecuteResponse, Error, void>({
    mutationFn: async () => {
      if (!repositoryId) throw new Error('repositoryId is required');
      return await executeRepository(repositoryId);
    },
  });
};
