import { useState, useRef } from 'react';
import {
  useCreateFileMutation,
  useMoveFileMutation,
  useRenameFileMutation,
  useDeleteFileMutation,
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
  editingNode: string | null; // string으로 변경

  // 모달 제어
  openCreateModal: (type: 'FILE' | 'FOLDER', parent?: FileTreeNode) => void;
  closeCreateModal: () => void;
  startEditing: (nodeId: string) => void; // string을 받도록 변경
  stopEditing: () => void;

  // CRUD 작업
  createItem: (fileName: string) => Promise<void>;
  renameItem: (node: FileTreeNode, newName: string) => Promise<void>;
  deleteItem: (node: FileTreeNode) => Promise<void>;
  moveItem: (sourceNode: FileTreeNode, targetNode: FileTreeNode) => Promise<void>;

  // 클립보드 작업
  canPaste: boolean;
  copyNode: (node: FileTreeNode) => void;
  cutNode: (node: FileTreeNode) => void;
  pasteNode: (targetNode?: FileTreeNode) => Promise<void>;

  // 로딩 상태
  isCreating: boolean;
  isRenaming: boolean;
  isDeleting: boolean;
  isMoving: boolean;
}

export const useFileTreeOperations = ({
  repositoryId,
  onSuccess,
}: UseFileTreeOperationsParams): UseFileTreeOperationsResult => {
  // 모달 상태
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalType, setCreateModalType] = useState<'FILE' | 'FOLDER' | null>(null);
  const [createModalParent, setCreateModalParent] = useState<FileTreeNode | null>(null);
  const [editingNode, setEditingNode] = useState<string | null>(null); // string으로 변경

  // 클립보드 상태
  const clipboardRef = useRef<{
    node: FileTreeNode;
    operation: 'copy' | 'cut';
  } | null>(null);

  // API Mutations
  const createMutation = useCreateFileMutation(repositoryId);
  const renameMutation = useRenameFileMutation(repositoryId);
  const deleteMutation = useDeleteFileMutation(repositoryId);
  const moveMutation = useMoveFileMutation(repositoryId);

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

  // 클립보드 작업 함수들
  const copyNode = (node: FileTreeNode) => {
    clipboardRef.current = { node, operation: 'copy' };
  };

  const cutNode = (node: FileTreeNode) => {
    clipboardRef.current = { node, operation: 'cut' };
  };

  const pasteNode = async (targetNode?: FileTreeNode) => {
    if (!clipboardRef.current) return;

    const { node: sourceNode, operation } = clipboardRef.current;

    try {
      if (operation === 'cut') {
        // 잘라내기: 이동 작업
        await moveItem(sourceNode, targetNode || sourceNode);
        clipboardRef.current = null; // 잘라내기 후 클립보드 비우기
      } else {
        // 복사: 새로운 파일 생성 (TODO: 실제 복사 API 구현 필요)
        console.log('복사 기능은 아직 구현되지 않았습니다.');
      }
    } catch (error) {
      console.error('붙여넣기 실패:', error);
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

    // 클립보드 작업
    canPaste: !!clipboardRef.current,
    copyNode,
    cutNode,
    pasteNode,

    // 로딩 상태
    isCreating: createMutation.isPending,
    isRenaming: renameMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isMoving: moveMutation.isPending,
  };
};
