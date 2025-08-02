import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { UseInfiniteQueryOptions } from '@tanstack/react-query';
import type { ChatMessagesDataResponse } from '@/schemas/chat.schema';
import type { AxiosError } from 'axios';

interface ChatMessagesParams {
  after?: number | null;
  before?: number | null;
  size?: number;
}

type UseGetPreviousChatInfiniteOptions = Omit<
  UseInfiniteQueryOptions<ChatMessagesDataResponse, AxiosError>,
  'queryKey' | 'queryFn' | 'initialPageParam' | 'getNextPageParam' | 'select'
>;

export const useGetChatMessagesInfinite = (
  repositoryId: string | number,
  params: ChatMessagesParams = {},
  options?: UseGetPreviousChatInfiniteOptions
) => {
  return useInfiniteQuery<ChatMessagesDataResponse, AxiosError>({
    queryKey: ['chat', 'messages', repositoryId, params],
    queryFn: async ({ pageParam }) => {
      const queryParams = new URLSearchParams();
      queryParams.append('size', (params.size || 20).toString());
      if (pageParam) {
        queryParams.append('before', pageParam.toString());
      }
      const response = await apiClient.get<ChatMessagesDataResponse>(
        `/api/repositories/${repositoryId}/chat/messages?${queryParams.toString()}`
      );
      return response.data;
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => {
      const messages = lastPage.data.messages;

      // 메시지가 없거나, 메시지 배열이 비어있으면 더 이상 다음 페이지가 없는 것으로 간주하고 undefined 반환
      if (!messages || messages.length === 0) {
        return undefined;
      }

      // 다음 페이지를 불러오기 위한 커서는 현재 페이지의 마지막 메시지 ID
      // 메시지가 최신순으로 정렬되었다면 배열의 마지막 요소가 가장 오래된 메시지
      const lastMessageId = messages[messages.length - 1].messageId;
      return lastMessageId;
    },
    enabled: !!repositoryId,
    gcTime: 5 * 60 * 1000, // 5분간 캐시 보관
    ...options,
  });
};
