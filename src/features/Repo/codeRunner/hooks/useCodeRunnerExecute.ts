import { useMutation } from '@tanstack/react-query';
import { executeRepository } from '@/api/codeRunner';

export const useCodeRunnerExecute = (repositoryId?: number | string) => {
  return useMutation({
    mutationFn: async () => {
      if (!repositoryId) throw new Error('repositoryId is required');
      return await executeRepository(repositoryId);
    },
  });
};
