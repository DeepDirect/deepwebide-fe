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
      // parentId가 없으면 최상단 폴더 사용
      let targetParentId = createModalParent?.fileId;

      if (!targetParentId && rootFolderId) {
        // 루트에 생성하려고 하면 최상단 폴더로 리다이렉트
        targetParentId = rootFolderId;
        console.log(`📂 루트 생성 → 최상단 폴더(${rootFolderId})로 리다이렉트`);
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
      console.log('🔄 파일 이동 시작:', {
        source: {
          id: sourceNode.fileId,
          name: sourceNode.fileName,
          path: sourceNode.path,
          currentParentId: sourceNode.parentId,
        },
        target: {
          id: targetNode.fileId,
          name: targetNode.fileName,
          path: targetNode.path,
          type: targetNode.fileType,
        },
      });

      // 타겟이 폴더인 경우 해당 폴더로 이동, 아니면 같은 레벨로 이동
      let newParentId: number | null;

      if (targetNode.fileType === 'FOLDER') {
        // 폴더 안으로 이동
        newParentId = targetNode.fileId;
        console.log(`📁 폴더 "${targetNode.fileName}" 안으로 이동`);
      } else {
        // 파일과 같은 레벨로 이동 (파일의 부모와 같은 레벨)
        newParentId = targetNode.parentId;
        console.log(
          `📄 파일 "${targetNode.fileName}"와 같은 레벨로 이동 (parentId: ${targetNode.parentId})`
        );
      }

      // 루트(null)로 이동하려는 경우 방지
      if (newParentId === null) {
        console.error('❌ 루트로 이동 불가 - 최상단 프로젝트 폴더 안에서만 이동 가능');
        throw new Error('파일을 루트로 이동할 수 없습니다. 폴더 안으로만 이동 가능합니다.');
      }

      // 같은 위치로 이동하려는 경우 체크
      if (sourceNode.parentId === newParentId) {
        console.log('⚠️ 같은 위치로 이동하려고 시도 - 이동 취소');
        console.log({
          currentParentId: sourceNode.parentId,
          targetParentId: newParentId,
          message: '이미 해당 위치에 있습니다',
        });
        return; // 이동하지 않고 종료
      }

      console.log('🎯 최종 이동 대상:', {
        sourceFileId: sourceNode.fileId,
        currentParentId: sourceNode.parentId,
        newParentId,
        isValidMove: sourceNode.parentId !== newParentId,
      });

      await moveMutation.mutateAsync({
        fileId: sourceNode.fileId,
        data: { newParentId },
      });

      console.log('✅ 파일 이동 완료');
      onSuccess?.();
    } catch (error) {
      console.error('❌ 파일 이동 실패:', error);
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

      // 루트에 업로드하려는 경우 방지
      if (!targetPath) {
        throw new Error('루트에는 파일을 업로드할 수 없습니다. 폴더 안으로 드래그해주세요.');
      }

      // 현재 제한사항 알림
      const fileNames = files.map(f => f.name).join(', ');
      const proceed = window.confirm(
        `현재 파일 내용 업로드는 지원되지 않습니다.\n` +
          `빈 파일로 생성됩니다: ${fileNames}\n\n` +
          `계속하시겠습니까?`
      );

      if (!proceed) {
        console.log('❌ 사용자가 업로드를 취소했습니다');
        return;
      }

      // 여러 파일을 순차적으로 업로드
      for (const file of files) {
        await uploadMutation.mutateAsync({
          file,
          parentPath: targetPath,
        });
      }

      console.log(`✅ 파일 생성 완료: ${files.length}개 파일 (빈 파일)`);
      onSuccess?.();
    } catch (error) {
      console.error('❌ 파일 업로드 실패:', error);

      // 사용자에게 에러 알림
      window.alert(
        `파일 생성에 실패했습니다.\n${error instanceof Error ? error.message : '알 수 없는 오류'}`
      );

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
