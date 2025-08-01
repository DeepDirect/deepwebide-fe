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

export interface RepositoryStopResponse {
  repositoryId: number;
  stopped: boolean;
  message: string;
}

export const stopRepository = async (
  repositoryId: number | string
): Promise<RepositoryStopResponse> => {
  const response = await apiClient.delete<undefined, { data: RepositoryStopResponse }>(
    `/api/repositories/${repositoryId}/stop`
  );
  return response.data.data;
};

export interface RepositoryLogsResponse {
  logs: string;
  port: number | null;
}

export const getRepositoryLogs = async (
  repositoryId: number | string,
  lines = 100,
  since = '10m'
): Promise<RepositoryLogsResponse> => {
  const response = await apiClient.get<{ data: RepositoryLogsResponse }>(
    `/api/repositories/${repositoryId}/logs`,
    { lines, since }
  );
  return response.data.data;
};
