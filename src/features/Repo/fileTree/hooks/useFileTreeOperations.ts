import { useState } from 'react';
import {
  useCreateFileMutation,
  useMoveFileMutation,
  useRenameFileMutation,
  useDeleteFileMutation,
  useUploadFileMutation,
} from './useFileTreeApi';
import { useToast } from '@/hooks/common/useToast';
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
  moveItem: (sourceNode: FileTreeNode, targetNode: FileTreeNode) => Promise<void>;
  uploadFiles: (files: File[], targetPath: string) => Promise<void>;

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
    if (!createModalType) return;

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
      onSuccess?.();
      toast.success(`${createModalType === 'FILE' ? '파일' : '폴더'}이 생성되었습니다.`);
    } catch (error) {
      toast.error('파일 생성에 실패했습니다.', undefined, true);
      throw error;
    }
  };

  const renameItem = async (node: FileTreeNode, newName: string) => {
    try {
      await renameMutation.mutateAsync({
        fileId: node.fileId,
        data: { newFileName: newName },
      });

      stopEditing();
      onSuccess?.();
      toast.success('이름이 변경되었습니다.');
    } catch (error) {
      toast.error('이름 변경에 실패했습니다.', undefined, true);
      throw error;
    }
  };

  const deleteItem = async (node: FileTreeNode) => {
    try {
      if (node.parentId === null) {
        toast.warning('최상위 프로젝트 폴더는 삭제할 수 없습니다.');
        return;
      }

      const confirmed = window.confirm(
        `"${node.fileName}"을(를) 삭제하시겠습니까?${
          node.fileType === 'FOLDER' ? '\n폴더와 하위 모든 파일이 삭제됩니다.' : ''
        }`
      );

      if (!confirmed) return;

      await deleteMutation.mutateAsync(node.fileId);
      onSuccess?.();
      toast.success('삭제되었습니다.');
    } catch (error) {
      toast.error('삭제에 실패했습니다.', undefined, true);
      throw error;
    }
  };

  const moveItem = async (sourceNode: FileTreeNode, targetNode: FileTreeNode) => {
    try {
      let newParentId: number | null;

      if (targetNode.fileType === 'FOLDER') {
        newParentId = targetNode.fileId;
      } else {
        newParentId = targetNode.parentId;
      }

      if (newParentId === null) {
        throw new Error('파일을 루트로 이동할 수 없습니다. 폴더 안으로만 이동 가능합니다.');
      }

      if (sourceNode.parentId === newParentId) {
        return;
      }

      await moveMutation.mutateAsync({
        fileId: sourceNode.fileId,
        data: { newParentId },
      });

      onSuccess?.();
      toast.success('파일이 이동되었습니다.');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : '파일 이동에 실패했습니다.',
        undefined,
        true
      );
      throw error;
    }
  };

  const uploadFiles = async (files: File[], targetPath: string) => {
    try {
      if (!targetPath) {
        throw new Error('루트에는 파일을 업로드할 수 없습니다. 폴더 안으로 드래그해주세요.');
      }

      const fileNames = files.map(f => f.name).join(', ');
      const proceed = window.confirm(
        `현재 파일 내용 업로드는 지원되지 않습니다.\n` +
          `빈 파일로 생성됩니다: ${fileNames}\n\n` +
          `계속하시겠습니까?`
      );

      if (!proceed) return;

      for (const file of files) {
        await uploadMutation.mutateAsync({
          file,
          parentPath: targetPath,
        });
      }

      onSuccess?.();
      toast.success(`${files.length}개 파일이 업로드되었습니다.`);
    } catch (error) {
      toast.error(
        `파일 생성에 실패했습니다.\n${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        undefined,
        true
      );
      throw error;
    }
  };

  return {
    createModalOpen,
    createModalType,
    createModalParent,
    editingNode,

    openCreateModal,
    closeCreateModal,
    startEditing,
    stopEditing,

    createItem,
    renameItem,
    deleteItem,
    moveItem,
    uploadFiles,

    isCreating: createMutation.isPending,
    isRenaming: renameMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isMoving: moveMutation.isPending,
    isUploading: uploadMutation.isPending,
  };
};
