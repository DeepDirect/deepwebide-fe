import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getFileTree, createFile, moveFile, renameFile, deleteFile } from '@/api/fileTree';
import type { CreateFileRequest, MoveFileRequest, RenameFileRequest } from '../types';

// 파일 트리 조회
export const useFileTreeQuery = (repositoryId: number) => {
  return useQuery({
    queryKey: ['fileTree', repositoryId],
    queryFn: () => getFileTree(repositoryId),
    enabled: !!repositoryId,
    retry: (failureCount, error) => {
      console.log(`파일 트리 조회 재시도 ${failureCount}/3:`, error);

      // 500 에러의 경우 1번만 재시도
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status: number } };
        if (axiosError.response?.status === 500) {
          return failureCount < 1;
        }
      }

      // 다른 에러의 경우 기본 재시도 (3번)
      return failureCount < 3;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// 파일/폴더 생성
export const useCreateFileMutation = (repositoryId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFileRequest) => createFile(repositoryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fileTree', repositoryId] });
    },
    onError: error => {
      console.error('파일 생성 실패:', error);
    },
  });
};

// 파일/폴더 이동
export const useMoveFileMutation = (repositoryId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ fileId, data }: { fileId: number; data: MoveFileRequest }) =>
      moveFile(repositoryId, fileId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fileTree', repositoryId] });
    },
    onError: error => {
      console.error('파일 이동 실패:', error);
    },
  });
};

// 파일/폴더 이름 변경
export const useRenameFileMutation = (repositoryId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ fileId, data }: { fileId: number; data: RenameFileRequest }) =>
      renameFile(repositoryId, fileId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fileTree', repositoryId] });
    },
    onError: error => {
      console.error('파일 이름 변경 실패:', error);
    },
  });
};

// 파일/폴더 삭제
export const useDeleteFileMutation = (repositoryId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fileId: number) => deleteFile(repositoryId, fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fileTree', repositoryId] });
    },
    onError: error => {
      console.error('파일 삭제 실패:', error);
    },
  });
};
