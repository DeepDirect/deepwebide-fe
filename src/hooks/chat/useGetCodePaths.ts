import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import {
  CodeReferencePathsResponseSchema,
  type CodeReferencePathsResponse,
} from '@/schemas/chat.schema';

const getCodePaths = async (repositoryId: string | number) => {
  const response = await apiClient.get<CodeReferencePathsResponse>(
    `/api/repositories/${repositoryId}/chat/code-paths`
  );

  const validatedData = CodeReferencePathsResponseSchema.parse(response.data);

  return {
    ...response,
    data: validatedData,
  };
};

export const useGetCodePaths = (repositoryId: string | number) => {
  return useQuery({
    queryKey: ['chat', 'code-paths', repositoryId],
    queryFn: () => getCodePaths(repositoryId),
    enabled: !!repositoryId,
  });
};
