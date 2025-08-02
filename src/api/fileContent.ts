import { apiClient } from '@/api/client';

export interface SaveFileContentRequest {
  content: string;
}

export interface SaveFileContentResponse {
  status: number;
  message: string;
  data: {
    fileId: number;
    fileName: string;
    path: string;
    updatedAt: string;
  };
}

export const saveFileContent = async (
  repositoryId: number,
  fileId: number,
  content: string
): Promise<SaveFileContentResponse> => {
  try {
    console.log(`파일 내용 저장 시작:`, {
      repositoryId,
      fileId,
      contentLength: content.length,
      timestamp: new Date().toISOString(),
    });

    const response = await apiClient.put<SaveFileContentRequest, SaveFileContentResponse>(
      `/api/repositories/${repositoryId}/files/${fileId}/content`,
      { content }
    );

    console.log('파일 내용 저장 성공:', {
      status: response.status,
      data: response.data,
    });

    return response.data;
  } catch (error) {
    console.error('파일 내용 저장 실패:', error);
    throw error;
  }
};
