import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getFileTree,
  createFile,
  moveFile,
  renameFile,
  deleteFile,
  uploadFile,
} from '@/api/fileTree';
import type { CreateFileRequest, MoveFileRequest, RenameFileRequest, FileTreeNode } from '../types';
import { useYjsFileTree } from '@/hooks/repo/useYjsFileTree';

// 파일 트리 조회는 그대로
export const useFileTreeQuery = (repositoryId: number) => {
  return useQuery<FileTreeNode[]>({
    queryKey: ['fileTree', repositoryId],
    queryFn: async () => {
      const response = await getFileTree(repositoryId);
      // Adjust the following line according to the actual response structure
      // For example, if response.data contains the array:
      return response.data as FileTreeNode[];
    },
    enabled: !!repositoryId,
  });
};

// 파일/폴더 생성
export const useCreateFileMutation = (repositoryId: number) => {
  const queryClient = useQueryClient();
  const { syncFileTreeFromServer, broadcastFileTreeUpdate } = useYjsFileTree(repositoryId);

  return useMutation({
    mutationFn: async (data: CreateFileRequest) => {
      const response = await createFile(repositoryId, data);
      // Adjust the following line according to your API response structure
      // For example, if response.data contains the created FileTreeNode:
      return response.data as FileTreeNode;
    },
    onSuccess: async (createdNode: FileTreeNode) => {
      try {
        // 1. React Query 캐시 무효화
        queryClient.invalidateQueries({ queryKey: ['fileTree', repositoryId] });

        // 2. 다른 클라이언트에게 작업 알림
        broadcastFileTreeUpdate('create', createdNode);

        // 3. 서버에서 최신 파일트리를 가져와서 YJS에 동기화
        await syncFileTreeFromServer();

        console.log('파일 생성 완료 및 동기화:', createdNode);
      } catch (error) {
        console.error('파일 생성 후 동기화 실패:', error);
      }
    },
    onError: error => {
      console.error('파일 생성 실패:', error);
    },
  });
};

// 파일 업로드 (생성과 동일하게 동기화)
export const useUploadFileMutation = (repositoryId: number) => {
  const queryClient = useQueryClient();
  const { syncFileTreeFromServer, broadcastFileTreeUpdate } = useYjsFileTree(repositoryId);

  return useMutation({
    mutationFn: async ({ file, parentPath }: { file: File; parentPath?: string }) => {
      const response = await uploadFile(repositoryId, file, parentPath);
      // Adjust the following line according to your API response structure
      // For example, if response.data contains the uploaded FileTreeNode:
      return response.data as FileTreeNode;
    },
    onSuccess: async (uploadedNode: FileTreeNode) => {
      try {
        queryClient.invalidateQueries({ queryKey: ['fileTree', repositoryId] });
        broadcastFileTreeUpdate('upload', uploadedNode);
        await syncFileTreeFromServer();

        console.log('파일 업로드 완료 및 동기화:', uploadedNode);
      } catch (error) {
        console.error('파일 업로드 후 동기화 실패:', error);
      }
    },
    onError: error => {
      console.error('파일 업로드 실패:', error);
    },
  });
};

// 파일/폴더 이동
export const useMoveFileMutation = (repositoryId: number) => {
  const queryClient = useQueryClient();
  const { syncFileTreeFromServer, broadcastFileTreeUpdate } = useYjsFileTree(repositoryId);

  return useMutation({
    mutationFn: async ({ fileId, data }: { fileId: number; data: MoveFileRequest }) => {
      const response = await moveFile(repositoryId, fileId, data);
      // Adjust the following line according to your API response structure
      // For example, if response.data contains the updated FileTreeNode:
      return response.data as FileTreeNode;
    },
    onSuccess: async (updatedNode: FileTreeNode) => {
      try {
        queryClient.invalidateQueries({ queryKey: ['fileTree', repositoryId] });
        broadcastFileTreeUpdate('move', { fileId: updatedNode.fileId, updatedNode });
        await syncFileTreeFromServer();

        console.log('파일 이동 완료 및 동기화:', updatedNode);
      } catch (error) {
        console.error('파일 이동 후 동기화 실패:', error);
      }
    },
    onError: error => {
      console.error('파일 이동 실패:', error);
    },
  });
};

// 파일/폴더 이름 변경
export const useRenameFileMutation = (repositoryId: number) => {
  const queryClient = useQueryClient();
  const { syncFileTreeFromServer, broadcastFileTreeUpdate } = useYjsFileTree(repositoryId);

  return useMutation({
    mutationFn: async ({ fileId, data }: { fileId: number; data: RenameFileRequest }) => {
      const response = await renameFile(repositoryId, fileId, data);
      // Adjust the following line according to your API response structure
      // For example, if response.data contains the updated FileTreeNode:
      return response.data as FileTreeNode;
    },
    onSuccess: async (updatedNode: FileTreeNode) => {
      try {
        queryClient.invalidateQueries({ queryKey: ['fileTree', repositoryId] });
        broadcastFileTreeUpdate('rename', { fileId: updatedNode.fileId, updatedNode });
        await syncFileTreeFromServer();

        console.log('파일 이름 변경 완료 및 동기화:', updatedNode);
      } catch (error) {
        console.error('파일 이름 변경 후 동기화 실패:', error);
      }
    },
    onError: error => {
      console.error('파일 이름 변경 실패:', error);
    },
  });
};

// 파일/폴더 삭제
export const useDeleteFileMutation = (repositoryId: number) => {
  const queryClient = useQueryClient();
  const { syncFileTreeFromServer, broadcastFileTreeUpdate } = useYjsFileTree(repositoryId);

  return useMutation({
    mutationFn: (fileId: number) => deleteFile(repositoryId, fileId),
    onSuccess: async (_result, fileId) => {
      try {
        queryClient.invalidateQueries({ queryKey: ['fileTree', repositoryId] });
        broadcastFileTreeUpdate('delete', { fileId });
        await syncFileTreeFromServer();

        console.log('파일 삭제 완료 및 동기화:', fileId);
      } catch (error) {
        console.error('파일 삭제 후 동기화 실패:', error);
      }
    },
    onError: error => {
      console.error('파일 삭제 실패:', error);
    },
  });
};
