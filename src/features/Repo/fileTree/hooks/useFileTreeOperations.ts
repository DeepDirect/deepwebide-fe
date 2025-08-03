import { useState } from 'react';
import {
  useCreateFileMutation,
  useMoveFileMutation,
  useRenameFileMutation,
  useDeleteFileMutation,
  useUploadFileMutation,
} from './useFileTreeApi';
import { useToast } from '@/hooks/common/useToast';
import { useYjsFileTree } from '@/hooks/repo/useYjsFileTree';
import type { FileTreeNode } from '../types';

interface UseFileTreeOperationsParams {
  repositoryId: number;
  onSuccess?: () => void;
  rootFolderId?: number;
}

interface UseFileTreeOperationsResult {
  // 모달 상태
  createModalOpen: boolean;
  createModalType: 'FILE' | 'FOLDER' | null;
  createModalParent: FileTreeNode | null;
  editingNode: string | null;

  // 모달 제어
  openCreateModal: (type: 'FILE' | 'FOLDER', parent?: FileTreeNode) => void;
  closeCreateModal: () => void;
  startEditing: (nodeId: string) => void;
  stopEditing: () => void;

  // CRUD 작업
  createItem: (fileName: string) => Promise<void>;
  renameItem: (node: FileTreeNode, newName: string) => Promise<void>;
  deleteItem: (node: FileTreeNode) => Promise<void>;
  moveItem: (
    sourceNode: FileTreeNode,
    targetNode: FileTreeNode | null,
    position?: string
  ) => Promise<void>;
  uploadFiles: (files: File[], targetParentId?: number) => Promise<void>;

  // 로딩 상태
  isCreating: boolean;
  isRenaming: boolean;
  isDeleting: boolean;
  isMoving: boolean;
  isUploading: boolean;
}

export const useFileTreeOperations = ({
  repositoryId,
  onSuccess,
  rootFolderId,
}: UseFileTreeOperationsParams): UseFileTreeOperationsResult => {
  const toast = useToast();
  const { broadcastFileTreeUpdate } = useYjsFileTree(repositoryId);

  // 모달 상태
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalType, setCreateModalType] = useState<'FILE' | 'FOLDER' | null>(null);
  const [createModalParent, setCreateModalParent] = useState<FileTreeNode | null>(null);
  const [editingNode, setEditingNode] = useState<string | null>(null);

  // API Mutations (YJS 동기화는 mutation hook에서 처리됨)
  const createMutation = useCreateFileMutation(repositoryId);
  const renameMutation = useRenameFileMutation(repositoryId);
  const deleteMutation = useDeleteFileMutation(repositoryId);
  const moveMutation = useMoveFileMutation(repositoryId);
  const uploadMutation = useUploadFileMutation(repositoryId);

  // 모달 제어 함수들
  const openCreateModal = (type: 'FILE' | 'FOLDER', parent?: FileTreeNode) => {
    setCreateModalType(type);
    setCreateModalParent(parent || null);
    setCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setCreateModalOpen(false);
    setCreateModalType(null);
    setCreateModalParent(null);
  };

  const startEditing = (nodeId: string) => {
    setEditingNode(nodeId);
  };

  const stopEditing = () => {
    setEditingNode(null);
  };

  // CRUD 작업 함수들
  const createItem = async (fileName: string) => {
    if (!createModalType) {
      toast.error('생성할 파일 타입이 지정되지 않았습니다.');
      return;
    }

    try {
      let targetParentId = createModalParent?.fileId;

      if (!targetParentId && rootFolderId) {
        targetParentId = rootFolderId;
      }

      if (!targetParentId) {
        throw new Error('파일을 생성할 폴더를 찾을 수 없습니다.');
      }

      await createMutation.mutateAsync({
        fileName,
        fileType: createModalType,
        parentId: targetParentId,
      });

      closeCreateModal();

      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '파일 생성에 실패했습니다.';
      toast.error(errorMessage);
      throw error;
    }
  };

  const renameItem = async (node: FileTreeNode, newName: string) => {
    if (!node || !node.fileId) {
      toast.error('유효하지 않은 파일입니다.');
      return;
    }

    try {
      await renameMutation.mutateAsync({
        fileId: node.fileId,
        data: { newFileName: newName },
      });

      stopEditing();

      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess();
      }

      toast.success(`"${node.fileName}"의 이름이 "${newName}"으로 변경되었습니다.`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '파일 이름 변경에 실패했습니다.';
      toast.error(errorMessage);
      throw error;
    }
  };

  const deleteItem = async (node: FileTreeNode) => {
    if (!node || !node.fileId) {
      toast.error('유효하지 않은 파일입니다.');
      return;
    }

    try {
      if (node.parentId === null) {
        toast.warning('최상위 프로젝트 폴더는 삭제할 수 없습니다.');
        return;
      }

      const deleteMessage = `"${node.fileName}"을(를) 삭제하시겠습니까?${
        node.fileType === 'FOLDER' ? '\n폴더와 하위 모든 파일이 삭제됩니다.' : ''
      }`;

      if (confirm(deleteMessage)) {
        await deleteMutation.mutateAsync(node.fileId);

        if (onSuccess && typeof onSuccess === 'function') {
          onSuccess();
        }

        toast.success(`"${node.fileName}"이(가) 삭제되었습니다.`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '파일 삭제에 실패했습니다.';
      toast.error(errorMessage);
      throw error;
    }
  };

  const moveItem = async (
    sourceNode: FileTreeNode,
    targetNode: FileTreeNode | null,
    position?: string
  ) => {
    if (!sourceNode || !sourceNode.fileId) {
      toast.error('이동할 파일이 유효하지 않습니다.');
      return;
    }

    try {
      // 동적으로 최상위 폴더 ID 계산
      const getRootFolderId = () => {
        if (rootFolderId) return rootFolderId;

        const pathParts = sourceNode.path.split('/');
        if (pathParts.length <= 1) {
          return sourceNode.parentId;
        }

        const currentParentId = sourceNode.parentId;
        let currentPath = sourceNode.path;

        while (currentPath.includes('/')) {
          const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
          if (!parentPath.includes('/')) {
            break;
          }
          currentPath = parentPath;
        }

        return currentParentId;
      };

      const dynamicRootFolderId = getRootFolderId();

      let newParentId: number | null = null;

      if (!targetNode || position === 'root') {
        if (!dynamicRootFolderId) {
          throw new Error('최상위 폴더를 찾을 수 없습니다.');
        }
        newParentId = dynamicRootFolderId;
      } else if (targetNode.fileType === 'FOLDER' && position === 'inside') {
        newParentId = targetNode.fileId;
      } else {
        newParentId = targetNode.parentId;
      }

      if (sourceNode.parentId === newParentId) {
        toast.info('동일한 위치로는 이동할 수 없습니다.');
        return;
      }

      const result = await moveMutation.mutateAsync({
        fileId: sourceNode.fileId,
        data: { newParentId },
      });

      // 최상위 폴더 이동의 경우 추가 브로드캐스트
      if (
        (!targetNode || position === 'root') &&
        broadcastFileTreeUpdate &&
        typeof broadcastFileTreeUpdate === 'function'
      ) {
        broadcastFileTreeUpdate('move', {
          node: result,
          repositoryId,
          timestamp: Date.now(),
          isTopLevelMove: true,
        });
      }

      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess();
      }

      if (!targetNode || position === 'root') {
        toast.success(`"${sourceNode.fileName}"을(를) 최상위 폴더로 이동했습니다.`);
      } else {
        toast.success(`"${sourceNode.fileName}"이(가) 이동되었습니다.`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '파일 이동에 실패했습니다.';
      toast.error(errorMessage);
      throw error;
    }
  };

  const uploadFiles = async (files: File[], targetParentId?: number) => {
    if (!files || files.length === 0) {
      toast.warning('업로드할 파일이 없습니다.');
      return;
    }

    try {
      let finalParentId = targetParentId;

      if (!finalParentId) {
        if (rootFolderId) {
          finalParentId = rootFolderId;
        } else {
          throw new Error('업로드할 폴더를 찾을 수 없습니다. 폴더를 선택해주세요.');
        }
      }

      const uploadPromises = files.map(file =>
        uploadMutation.mutateAsync({
          file,
          parentId: finalParentId!,
        })
      );

      await Promise.all(uploadPromises);

      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess();
      }

      toast.success(`${files.length}개 파일 업로드가 완료되었습니다.`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '파일 업로드에 실패했습니다.';
      toast.error(errorMessage);
      throw error;
    }
  };

  return {
    // 모달 상태
    createModalOpen,
    createModalType,
    createModalParent,
    editingNode,

    // 모달 제어
    openCreateModal,
    closeCreateModal,
    startEditing,
    stopEditing,

    // CRUD 작업
    createItem,
    renameItem,
    deleteItem,
    moveItem,
    uploadFiles,

    // 로딩 상태
    isCreating: createMutation.isPending,
    isRenaming: renameMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isMoving: moveMutation.isPending,
    isUploading: uploadMutation.isPending,
  };
};
