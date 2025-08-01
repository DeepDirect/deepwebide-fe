import { apiClient } from '@/api/client';

export interface RepositoryExecuteResponse {
  uuid: string;
  s3Url: string;
  port: number;
  message: string;
  executionId: string;
  status: string;
  output: string;
  error: string;
  executionTime: number;
}

export const executeRepository = async (
  repositoryId: number | string
): Promise<RepositoryExecuteResponse> => {
  const response = await apiClient.post<undefined, { data: RepositoryExecuteResponse }>(
    `/api/repositories/${repositoryId}/execute`
  );
  return response.data.data;
};
