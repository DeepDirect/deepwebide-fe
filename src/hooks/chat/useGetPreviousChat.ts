import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { ChatMessagesResponseSchema, type ChatMessagesResponse } from '@/schemas/chat.schema';

interface ChatMessagesParams {
  after?: number | null;
  before?: number | null;
  size?: number;
}

const getChatMessages = async (repositoryId: string | number, params: ChatMessagesParams = {}) => {
  const { after, before, size = 20 } = params;

  const queryParams = new URLSearchParams();
  queryParams.append('size', size.toString());

  if (after !== null && after !== undefined) {
    queryParams.append('after', after.toString());
  }

  if (before !== null && before !== undefined) {
    queryParams.append('before', before.toString());
  }

  const response = await apiClient.get<ChatMessagesResponse>(
    `/api/repositories/${repositoryId}/chat/messages?${queryParams.toString()}`
  );

  const validatedData = ChatMessagesResponseSchema.parse(response.data);

  return {
    ...response,
    data: validatedData,
  };
};

export const useGetPreviousChat = (
  repositoryId: string | number,
  params: ChatMessagesParams = {},
  options = {}
) => {
  return useQuery({
    queryKey: ['chat', 'messages', repositoryId, params],
    queryFn: () => getChatMessages(repositoryId, params),
    enabled: !!repositoryId,
    ...options,
  });
};

// 무한 스크롤을 위한 별도 훅... 확장해 볼 예정
export const useGetChatMessagesInfinite = (
  repositoryId: string | number,
  initialParams: ChatMessagesParams = {}
) => {
  return useQuery({
    queryKey: ['chat', 'messages', 'infinite', repositoryId, initialParams],
    queryFn: () => getChatMessages(repositoryId, initialParams),
    enabled: !!repositoryId,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};
