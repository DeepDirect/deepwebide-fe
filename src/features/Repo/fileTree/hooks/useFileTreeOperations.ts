import { useState } from 'react';
import {
  useCreateFileMutation,
  useMoveFileMutation,
  useRenameFileMutation,
  useDeleteFileMutation,
  useUploadFileMutation,
} from './useFileTreeApi';
import type { FileTreeNode } from '../types';

interface UseFileTreeOperationsParams {
  repositoryId: number;
  onSuccess?: () => void;
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
}: UseFileTreeOperationsParams): UseFileTreeOperationsResult => {
  // 모달 상태
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalType, setCreateModalType] = useState<'FILE' | 'FOLDER' | null>(null);
  const [createModalParent, setCreateModalParent] = useState<FileTreeNode | null>(null);
  const [editingNode, setEditingNode] = useState<string | null>(null);

  // API Mutations
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
      await createMutation.mutateAsync({
        fileName,
        fileType: createModalType,
        parentId: createModalParent?.fileId,
      });

      closeCreateModal();
      onSuccess?.();
    } catch (error) {
      console.error('파일 생성 실패:', error);
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
    } catch (error) {
      console.error('파일 이름 변경 실패:', error);
      throw error;
    }
  };

  const deleteItem = async (node: FileTreeNode) => {
    try {
      const confirmed = window.confirm(
        `"${node.fileName}"을(를) 삭제하시겠습니까?${
          node.fileType === 'FOLDER' ? '\n폴더와 하위 모든 파일이 삭제됩니다.' : ''
        }`
      );

      if (!confirmed) return;

      await deleteMutation.mutateAsync(node.fileId);
      onSuccess?.();
    } catch (error) {
      console.error('파일 삭제 실패:', error);
      throw error;
    }
  };

  const moveItem = async (sourceNode: FileTreeNode, targetNode: FileTreeNode) => {
    try {
      // 타겟이 폴더인 경우 해당 폴더로 이동, 아니면 같은 레벨로 이동
      const newParentId =
        targetNode.fileType === 'FOLDER' ? targetNode.fileId : targetNode.parentId;

      await moveMutation.mutateAsync({
        fileId: sourceNode.fileId,
        data: { newParentId: newParentId || 0 }, // null인 경우 루트로 이동
      });

      onSuccess?.();
    } catch (error) {
      console.error('파일 이동 실패:', error);
      throw error;
    }
  };

  // 파일 업로드 함수 (외부 드래그앤드롭용)
  const uploadFiles = async (files: File[], targetPath: string) => {
    try {
      console.log(`📤 파일 업로드 시작:`, {
        files: files.map(f => f.name),
        targetPath: targetPath || '(루트)',
        repositoryId,
      });

      // 여러 파일을 순차적으로 업로드
      for (const file of files) {
        await uploadMutation.mutateAsync({
          file,
          parentPath: targetPath || undefined,
        });
      }

      console.log(`✅ 파일 업로드 완료: ${files.length}개 파일`);
      onSuccess?.();
    } catch (error) {
      console.error('❌ 파일 업로드 실패:', error);
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
