import { useState, useCallback } from 'react';
import { useFileTreeClipboard } from './useFileTreeClipboard';
import type { FileTreeNode } from '../types';

interface UseFileTreeOperationsProps {
  repoId: string;
}

interface UseFileTreeOperationsReturn {
  // 모달 상태
  createModalOpen: boolean;
  createModalType: 'file' | 'folder';
  createModalParent: FileTreeNode | undefined;
  editingNode: FileTreeNode | null;

  // 모달 제어
  openCreateModal: (type: 'file' | 'folder', parent?: FileTreeNode) => void;
  closeCreateModal: () => void;
  startEditing: (node: FileTreeNode) => void;
  stopEditing: () => void;

  // CRUD 작업
  createItem: (name: string, parentPath?: string) => Promise<void>;
  renameItem: (node: FileTreeNode, newName: string) => Promise<void>;
  deleteItem: (node: FileTreeNode) => Promise<void>;

  // 클립보드 작업
  clipboardItem: ReturnType<typeof useFileTreeClipboard>['clipboardItem'];
  canPaste: boolean;
  copyNode: (node: FileTreeNode) => void;
  cutNode: (node: FileTreeNode) => void;
  pasteNode: (targetNode?: FileTreeNode) => Promise<void>;
}

export const useFileTreeOperations = ({
  repoId,
}: UseFileTreeOperationsProps): UseFileTreeOperationsReturn => {
  // 모달 상태
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalType, setCreateModalType] = useState<'file' | 'folder'>('file');
  const [createModalParent, setCreateModalParent] = useState<FileTreeNode | undefined>();
  const [editingNode, setEditingNode] = useState<FileTreeNode | null>(null);

  // 클립보드 훅
  const {
    clipboardItem,
    canPaste,
    copyNode,
    cutNode,
    pasteNode: clipboardPaste,
  } = useFileTreeClipboard(handlePasteOperation);

  // 모달 제어
  const openCreateModal = useCallback((type: 'file' | 'folder', parent?: FileTreeNode) => {
    setCreateModalType(type);
    setCreateModalParent(parent);
    setCreateModalOpen(true);
  }, []);

  const closeCreateModal = useCallback(() => {
    setCreateModalOpen(false);
    setCreateModalParent(undefined);
  }, []);

  const startEditing = useCallback((node: FileTreeNode) => {
    setEditingNode(node);
  }, []);

  const stopEditing = useCallback(() => {
    setEditingNode(null);
  }, []);

  // CRUD 작업들
  const createItem = useCallback(
    async (name: string, parentPath?: string) => {
      try {
        console.log(`🔨 ${createModalType} 생성:`, { name, parentPath, repoId });

        // TODO: 실제 API 호출
        // const response = await apiClient.post(`/api/repos/${repoId}/files`, {
        //   name,
        //   type: createModalType,
        //   parentPath: parentPath || '',
        // });

        // 임시로 성공 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 500));

        // TODO: API 응답으로 트리 데이터 업데이트
        console.log(`✅ ${createModalType} 생성 완료:`, name);

        closeCreateModal();
      } catch (error) {
        console.error(`❌ ${createModalType} 생성 실패:`, error);
        throw error;
      }
    },
    [createModalType, repoId, closeCreateModal]
  );

  const renameItem = useCallback(
    async (node: FileTreeNode, newName: string) => {
      try {
        console.log('📝 이름 변경:', { oldName: node.name, newName, path: node.path });

        // TODO: 실제 API 호출
        // const response = await apiClient.patch(`/api/repos/${repoId}/files/${node.id}`, {
        //   name: newName,
        // });

        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('✅ 이름 변경 완료:', newName);
        stopEditing();
      } catch (error) {
        console.error('❌ 이름 변경 실패:', error);
        throw error;
      }
    },
    [stopEditing]
  );

  const deleteItem = useCallback(async (node: FileTreeNode) => {
    try {
      console.log('🗑️ 삭제:', { name: node.name, path: node.path });

      // TODO: 실제 API 호출
      // const response = await apiClient.delete(`/api/repos/${repoId}/files/${node.id}`);

      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('✅ 삭제 완료:', node.name);
    } catch (error) {
      console.error('❌ 삭제 실패:', error);
      throw error;
    }
  }, []);

  // 클립보드 붙여넣기 실제 구현
  async function handlePasteOperation(
    sourceNode: FileTreeNode,
    targetPath: string,
    operation: 'copy' | 'cut'
  ): Promise<void> {
    try {
      console.log(`📋 ${operation === 'copy' ? '복사' : '이동'}:`, {
        source: sourceNode.path,
        target: targetPath,
      });

      // TODO: 실제 API 호출
      // const response = await apiClient.post(`/api/repos/${repoId}/files/${sourceNode.id}/${operation}`, {
      //   targetPath,
      // });

      await new Promise(resolve => setTimeout(resolve, 500));

      console.log(`✅ ${operation === 'copy' ? '복사' : '이동'} 완료`);
    } catch (error) {
      console.error(`❌ ${operation === 'copy' ? '복사' : '이동'} 실패:`, error);
      throw error;
    }
  }

  const pasteNode = useCallback(
    async (targetNode?: FileTreeNode) => {
      await clipboardPaste(targetNode);
    },
    [clipboardPaste]
  );

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

    // 클립보드 작업
    clipboardItem,
    canPaste,
    copyNode,
    cutNode,
    pasteNode,
  };
};
