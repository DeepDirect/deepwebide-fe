import { useState, useCallback } from 'react';
import { useFileTreeClipboard } from './useFileTreeClipboard';
import { createFileRequest, renameFileRequest, deleteFileRequest, moveFileRequest } from '../utils';
import type { FileTreeNode } from '../types';

interface UseFileTreeOperationsProps {
  repoId: string;
}

interface UseFileTreeOperationsReturn {
  // 모달 상태
  createModalOpen: boolean;
  createModalType: 'FILE' | 'FOLDER';
  createModalParent: FileTreeNode | undefined;
  editingNode: FileTreeNode | null;

  // 모달 제어
  openCreateModal: (type: 'FILE' | 'FOLDER', parent?: FileTreeNode) => void;
  closeCreateModal: () => void;
  startEditing: (node: FileTreeNode) => void;
  stopEditing: () => void;

  // CRUD 작업
  createItem: (name: string, parentPath?: string) => Promise<void>;
  renameItem: (node: FileTreeNode, newName: string) => Promise<void>;
  deleteItem: (node: FileTreeNode) => Promise<void>;
  moveItem: (
    draggedNode: FileTreeNode,
    targetNode: FileTreeNode,
    position: 'inside' | 'before' | 'after'
  ) => Promise<void>;

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
  const [createModalType, setCreateModalType] = useState<'FILE' | 'FOLDER'>('FILE');
  const [createModalParent, setCreateModalParent] = useState<FileTreeNode | undefined>();
  const [editingNode, setEditingNode] = useState<FileTreeNode | null>(null);

  // 클립보드 붙여넣기 실제 구현
  const handlePasteOperation = useCallback(
    async (
      sourceNode: FileTreeNode,
      targetPath: string,
      operation: 'copy' | 'cut'
    ): Promise<void> => {
      try {
        console.log(`📋 ${operation === 'copy' ? '복사' : '이동'}:`, {
          source: sourceNode.path,
          target: targetPath,
          repoId,
        });

        // API 요청 데이터 생성
        const requestData = {
          operation,
          fileId: sourceNode.fileId,
          targetPath,
        };

        console.log('📤 API 요청 데이터:', requestData);

        // TODO: 실제 API 호출
        // const response = await apiClient.post(`/api/repositories/${repoId}/files/${sourceNode.fileId}/${operation}`, requestData);

        await new Promise(resolve => setTimeout(resolve, 500));

        console.log(`✅ ${operation === 'copy' ? '복사' : '이동'} 완료`);
      } catch (error) {
        console.error(`❌ ${operation === 'copy' ? '복사' : '이동'} 실패:`, error);
        throw error;
      }
    },
    [repoId]
  );

  // 클립보드 훅
  const {
    clipboardItem,
    canPaste,
    copyNode,
    cutNode,
    pasteNode: clipboardPaste,
  } = useFileTreeClipboard(handlePasteOperation);

  // 모달 제어
  const openCreateModal = useCallback((type: 'FILE' | 'FOLDER', parent?: FileTreeNode) => {
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

        // API 요청 데이터 생성
        const requestData = createFileRequest(name, createModalType, createModalParent);

        console.log('📤 API 요청 데이터:', requestData);

        // TODO: 실제 API 호출
        // const response = await apiClient.post(`/api/repositories/${repoId}/files`, requestData);

        // 임시로 성공 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log(`✅ ${createModalType} 생성 완료:`, name);
        closeCreateModal();
      } catch (error) {
        console.error(`❌ ${createModalType} 생성 실패:`, error);
        throw error;
      }
    },
    [createModalType, createModalParent, repoId, closeCreateModal]
  );

  const renameItem = useCallback(
    async (node: FileTreeNode, newName: string) => {
      try {
        console.log('📝 이름 변경:', { oldName: node.fileName, newName, path: node.path, repoId });

        // API 요청 데이터 생성
        const requestData = renameFileRequest(node, newName);

        console.log('📤 API 요청 데이터:', requestData);

        // TODO: 실제 API 호출
        // const response = await apiClient.patch(`/api/repositories/${repoId}/files/${node.fileId}`, requestData);

        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('✅ 이름 변경 완료:', newName);
        stopEditing();
      } catch (error) {
        console.error('❌ 이름 변경 실패:', error);
        throw error;
      }
    },
    [repoId, stopEditing]
  );

  const deleteItem = useCallback(
    async (node: FileTreeNode) => {
      try {
        console.log('🗑️ 삭제:', { name: node.fileName, path: node.path, repoId });

        // API 요청 데이터 생성
        const requestData = deleteFileRequest(node);

        console.log('📤 API 요청 데이터:', requestData);

        // TODO: 실제 API 호출
        // const response = await apiClient.delete(`/api/repositories/${repoId}/files/${node.fileId}`);

        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('✅ 삭제 완료:', node.fileName);
      } catch (error) {
        console.error('❌ 삭제 실패:', error);
        throw error;
      }
    },
    [repoId]
  );

  // 파일/폴더 이동 기능
  const moveItem = useCallback(
    async (
      draggedNode: FileTreeNode,
      targetNode: FileTreeNode,
      position: 'inside' | 'before' | 'after'
    ) => {
      try {
        console.log('📂 이동 시작:', {
          source: draggedNode.path,
          target: targetNode.path,
          position,
          repoId,
        });

        // 목적지 경로 계산
        let destinationPath: string;

        if (position === 'inside' && targetNode.fileType === 'FOLDER') {
          // 폴더 내부로 이동
          destinationPath = `${targetNode.path}/${draggedNode.fileName}`;
        } else {
          // 같은 레벨로 이동 (before/after)
          const targetParentPath = targetNode.path.includes('/')
            ? targetNode.path.split('/').slice(0, -1).join('/')
            : '';
          destinationPath = targetParentPath
            ? `${targetParentPath}/${draggedNode.fileName}`
            : draggedNode.fileName;
        }

        // 이미 같은 위치에 있는지 확인
        if (draggedNode.path === destinationPath) {
          console.log('⚠️ 같은 위치로 이동 시도, 무시됨');
          return;
        }

        // API 요청 데이터 생성
        const requestData = moveFileRequest(draggedNode, destinationPath);

        console.log('📤 API 요청 데이터:', requestData);

        // TODO: 실제 API 호출
        // const response = await apiClient.patch(`/api/repositories/${repoId}/files/${draggedNode.fileId}/move`, requestData);

        // 임시로 성공 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 800));

        console.log('✅ 이동 완료:', {
          from: draggedNode.path,
          to: destinationPath,
        });
      } catch (error) {
        console.error('❌ 이동 실패:', error);
        throw error;
      }
    },
    [repoId]
  );

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
    moveItem,

    // 클립보드 작업
    clipboardItem,
    canPaste,
    copyNode,
    cutNode,
    pasteNode,
  };
};
