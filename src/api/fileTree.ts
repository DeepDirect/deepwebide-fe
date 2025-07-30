import { apiClient } from '@/api/client';
import type {
  ApiFileTreeResponse,
  FileOperationResponse,
  DeleteFileResponse,
  CreateFileRequest,
  MoveFileRequest,
  RenameFileRequest,
} from '@/features/Repo/fileTree/types';

// 파일 트리 조회
export const getFileTree = async (repositoryId: number): Promise<ApiFileTreeResponse> => {
  try {
    console.log(`📂 파일 트리 조회 시작:`, {
      repositoryId,
      url: `api/repositories/${repositoryId}/files`,
      timestamp: new Date().toISOString(),
    });

    const response = await apiClient.get<ApiFileTreeResponse>(
      `api/repositories/${repositoryId}/files`
    );

    console.log('📂 파일 트리 조회 성공:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
    });

    return response.data;
  } catch (error) {
    console.error('❌ 파일 트리 조회 실패:', error);

    // 에러 정보를 더 자세히 로깅
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as {
        response?: {
          status: number;
          statusText: string;
          data: unknown;
          headers: unknown;
        };
        request?: unknown;
        config?: {
          url?: string;
          method?: string;
          headers?: unknown;
          baseURL?: string;
        };
      };

      console.error('🔍 상세 에러 정보:', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        responseData: axiosError.response?.data,
        requestUrl: axiosError.config?.url,
        requestMethod: axiosError.config?.method,
        requestHeaders: axiosError.config?.headers,
        baseURL: axiosError.config?.baseURL,
        fullUrl: `${axiosError.config?.baseURL || ''}${axiosError.config?.url || ''}`,
      });
    }

    throw error;
  }
};

// 파일/폴더 생성
export const createFile = async (
  repositoryId: number,
  data: CreateFileRequest
): Promise<FileOperationResponse> => {
  const response = await apiClient.post<CreateFileRequest, FileOperationResponse>(
    `api/repositories/${repositoryId}/files`,
    data
  );
  return response.data;
};

// 파일/폴더 이동
export const moveFile = async (
  repositoryId: number,
  fileId: number,
  data: MoveFileRequest
): Promise<FileOperationResponse> => {
  const response = await apiClient.patch<MoveFileRequest, FileOperationResponse>(
    `api/repositories/${repositoryId}/files/${fileId}/move`,
    data
  );
  return response.data;
};

// 파일/폴더 이름 변경
export const renameFile = async (
  repositoryId: number,
  fileId: number,
  data: RenameFileRequest
): Promise<FileOperationResponse> => {
  const response = await apiClient.patch<RenameFileRequest, FileOperationResponse>(
    `api/repositories/${repositoryId}/files/${fileId}/rename`,
    data
  );
  return response.data;
};

// 파일/폴더 삭제
export const deleteFile = async (
  repositoryId: number,
  fileId: number
): Promise<DeleteFileResponse> => {
  const response = await apiClient.delete<undefined, DeleteFileResponse>(
    `api/repositories/${repositoryId}/files/${fileId}`
  );
  return response.data;
};
