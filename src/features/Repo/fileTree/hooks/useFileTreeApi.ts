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

// 파일 트리 조회
export const useFileTreeQuery = (repositoryId: number) => {
  return useQuery<FileTreeNode[]>({
    queryKey: ['fileTree', repositoryId],
    queryFn: async () => {
      const response = await getFileTree(repositoryId);
      return response.data as FileTreeNode[];
    },
    enabled: !!repositoryId,
  });
};

// 파일/폴더 생성
export const useCreateFileMutation = (repositoryId: number) => {
  const queryClient = useQueryClient();
  const { broadcastFileTreeUpdate } = useYjsFileTree(repositoryId);

  return useMutation({
    mutationFn: async (data: CreateFileRequest) => {
      const response = await createFile(repositoryId, data);
      return response.data as FileTreeNode;
    },
    onSuccess: async (createdNode: FileTreeNode) => {
      try {
        // 1. React Query 캐시 무효화
        await queryClient.invalidateQueries({ queryKey: ['fileTree', repositoryId] });

        // 2. YJS 브로드캐스트로 다른 클라이언트에게 알림 (안전하게 호출)
        if (broadcastFileTreeUpdate && typeof broadcastFileTreeUpdate === 'function') {
          broadcastFileTreeUpdate('create', {
            node: createdNode,
            repositoryId,
            timestamp: Date.now(),
          });
          console.log('파일 생성 YJS 브로드캐스트 완료:', createdNode.fileName);
        } else {
          console.log('YJS 브로드캐스트 함수가 없음 (일반 모드)');
        }

        console.log('파일 생성 완료:', createdNode);
      } catch (error) {
        console.error('파일 생성 후 처리 실패:', error);
      }
    },
    onError: error => {
      console.error('파일 생성 실패:', error);
    },
  });
};

// 파일/폴더 이동
export const useMoveFileMutation = (repositoryId: number) => {
  const queryClient = useQueryClient();
  const { broadcastFileTreeUpdate } = useYjsFileTree(repositoryId);

  return useMutation({
    mutationFn: async ({ fileId, data }: { fileId: number; data: MoveFileRequest }) => {
      const response = await moveFile(repositoryId, fileId, data);
      return response.data as FileTreeNode;
    },
    onSuccess: async (updatedNode: FileTreeNode) => {
      try {
        await queryClient.invalidateQueries({ queryKey: ['fileTree', repositoryId] });

        if (broadcastFileTreeUpdate && typeof broadcastFileTreeUpdate === 'function') {
          broadcastFileTreeUpdate('move', {
            node: updatedNode,
            repositoryId,
            timestamp: Date.now(),
          });
          console.log('파일 이동 YJS 브로드캐스트 완료:', updatedNode.fileName);
        }

        console.log('파일 이동 완료:', updatedNode);
      } catch (error) {
        console.error('파일 이동 후 처리 실패:', error);
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
  const { broadcastFileTreeUpdate } = useYjsFileTree(repositoryId);

  return useMutation({
    mutationFn: async ({ fileId, data }: { fileId: number; data: RenameFileRequest }) => {
      const response = await renameFile(repositoryId, fileId, data);
      return response.data as FileTreeNode;
    },
    onSuccess: async (updatedNode: FileTreeNode) => {
      try {
        await queryClient.invalidateQueries({ queryKey: ['fileTree', repositoryId] });

        if (broadcastFileTreeUpdate && typeof broadcastFileTreeUpdate === 'function') {
          broadcastFileTreeUpdate('rename', {
            node: updatedNode,
            repositoryId,
            timestamp: Date.now(),
          });
          console.log('파일 이름 변경 YJS 브로드캐스트 완료:', updatedNode.fileName);
        }

        console.log('파일 이름 변경 완료:', updatedNode);
      } catch (error) {
        console.error('파일 이름 변경 후 처리 실패:', error);
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
  const { broadcastFileTreeUpdate } = useYjsFileTree(repositoryId);

  return useMutation({
    mutationFn: (fileId: number) => deleteFile(repositoryId, fileId),
    onSuccess: async (_result, fileId) => {
      try {
        await queryClient.invalidateQueries({ queryKey: ['fileTree', repositoryId] });

        if (broadcastFileTreeUpdate && typeof broadcastFileTreeUpdate === 'function') {
          broadcastFileTreeUpdate('delete', {
            fileId,
            repositoryId,
            timestamp: Date.now(),
          });
          console.log('파일 삭제 YJS 브로드캐스트 완료:', fileId);
        }

        console.log('파일 삭제 완료:', fileId);
      } catch (error) {
        console.error('파일 삭제 후 처리 실패:', error);
      }
    },
    onError: error => {
      console.error('파일 삭제 실패:', error);
    },
  });
};

// 파일 업로드
export const useUploadFileMutation = (repositoryId: number) => {
  const queryClient = useQueryClient();
  const { broadcastFileTreeUpdate } = useYjsFileTree(repositoryId);

  return useMutation({
    mutationFn: async ({ file, parentId }: { file: File; parentId: number }) => {
      const response = await uploadFile(repositoryId, file, parentId);
      return response.data as FileTreeNode;
    },
    onSuccess: async (uploadedNode: FileTreeNode) => {
      try {
        await queryClient.invalidateQueries({ queryKey: ['fileTree', repositoryId] });

        if (broadcastFileTreeUpdate && typeof broadcastFileTreeUpdate === 'function') {
          broadcastFileTreeUpdate('upload', {
            node: uploadedNode,
            repositoryId,
            timestamp: Date.now(),
          });
          console.log('파일 업로드 YJS 브로드캐스트 완료:', uploadedNode.fileName);
        }

        console.log('파일 업로드 완료:', uploadedNode);
      } catch (error) {
        console.error('파일 업로드 후 처리 실패:', error);
      }
    },
    onError: error => {
      console.error('파일 업로드 실패:', error);
    },
  });
};
