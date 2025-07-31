import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';

interface FileContentResponse {
  status: number;
  message: string;
  data: {
    fileId: number;
    fileName: string;
    path: string;
    updatedAt: string;
    content: string;
  } | null;
}

interface UseFileContentParams {
  repositoryId: number;
  filePath: string;
  enabled?: boolean;
}

// 파일 내용을 가져오는 훅 - API 연동 추가
export const useFileContent = ({
  repositoryId,
  filePath,
  enabled = true,
}: UseFileContentParams) => {
  return useQuery({
    queryKey: ['fileContent', repositoryId, filePath],
    queryFn: async (): Promise<FileContentResponse> => {
      console.log(`파일 내용 요청:`, {
        repositoryId,
        filePath,
        url: `/api/repositories/${repositoryId}/files/content`,
      });

      // 실제 API 호출
      const response = await apiClient.get<FileContentResponse>(
        `/api/repositories/${repositoryId}/files/content?path=${encodeURIComponent(filePath)}`
      );

      console.log(`파일 내용 응답:`, {
        status: response.status,
        filePath,
        contentLength: response.data?.data?.content?.length || 0,
      });

      return response.data;
    },
    enabled: enabled && !!repositoryId && !!filePath,
    staleTime: 1000 * 60 * 5, // 5분
    retry: (failureCount, error) => {
      // 404 에러는 재시도하지 않음 (파일이 존재하지 않음)
      if (
        error instanceof Error &&
        'status' in error &&
        (error as unknown as { status: number }).status === 404
      ) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

// 여러 파일의 내용을 병렬로 가져오는 훅
export const useMultipleFileContents = (
  files: Array<{ repositoryId: number; filePath: string }>
) => {
  return useQuery({
    queryKey: ['multipleFileContents', files],
    queryFn: async () => {
      console.log(`여러 파일 내용 요청:`, { fileCount: files.length });

      const promises = files.map(({ repositoryId, filePath }) =>
        apiClient.get<FileContentResponse>(`/api/repositories/${repositoryId}/files/content`, {
          params: { path: filePath },
        })
      );

      const responses = await Promise.allSettled(promises);

      return responses.map((result, index) => ({
        filePath: files[index].filePath,
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value.data : null,
        error: result.status === 'rejected' ? result.reason : null,
      }));
    },
    enabled: files.length > 0,
    staleTime: 1000 * 60 * 5,
  });
};
