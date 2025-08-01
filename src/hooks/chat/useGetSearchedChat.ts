import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { SearchMessagesResponseSchema, type SearchMessagesResponse } from '@/schemas/chat.schema';

const searchChatMessages = async (repositoryId: string | number, keyword: string) => {
  const response = await apiClient.get<SearchMessagesResponse>(
    `/api/repositories/${repositoryId}/chat/search?keyword=${encodeURIComponent(keyword)}`
  );

  const validatedData = SearchMessagesResponseSchema.parse(response.data);

  return {
    ...response,
    data: validatedData,
  };
};

export const useGetSearchedChat = (
  repositoryId: string | number,
  keyword: string,
  options = {}
) => {
  return useQuery({
    queryKey: ['chat', 'search', repositoryId, keyword],
    queryFn: () => searchChatMessages(repositoryId, keyword),
    enabled: !!repositoryId && !!keyword && keyword.trim().length > 0,
    ...options,
  });
};
