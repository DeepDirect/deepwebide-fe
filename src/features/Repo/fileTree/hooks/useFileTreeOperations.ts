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
  uploadFiles: (files: File[], targetPath: string) => Promise<void>;

  // 로딩 상태
  isCreating: boolean;
  isRenaming: boolean;
  isDeleting: boolean;
  isMoving: boolean;
  isUploading: boolean;
}

// 안전한 ID 변환 함수
const safeToString = (value: unknown): string => {
  if (value === null || value === undefined) {
    console.warn('safeToString: null 또는 undefined 값 감지');
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return value.toString();
  }

  // 객체나 다른 타입인 경우
  try {
    return String(value);
  } catch (error) {
    console.error('safeToString 변환 실패:', error);
    return '';
  }
};

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
    const safeNodeId = safeToString(nodeId);
    if (safeNodeId) {
      setEditingNode(safeNodeId);
    } else {
      //
    }
  };

  const stopEditing = () => {
    setEditingNode(null);
  };

  // CRUD 작업 함수들
  const createItem = async (fileName: string) => {
    if (!createModalType) {
      toast.error('createItem: createModalType이 없음');
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

      // 성공 콜백 호출
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess();
      }
    } catch (error) {
      console.error('파일 생성 실패:', error);
      throw error;
    }
  };

  const renameItem = async (node: FileTreeNode, newName: string) => {
    if (!node || !node.fileId) {
      console.error('renameItem: 유효하지 않은 node:', node);
      return;
    }

    try {
      console.log('파일 이름 변경 시작:', {
        currentName: node.fileName,
        newName,
        fileId: node.fileId,
      });

      await renameMutation.mutateAsync({
        fileId: node.fileId,
        data: { newFileName: newName },
      });

      stopEditing();

      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess();
      }

      console.log('파일 이름 변경 완료 - YJS 동기화됨');
    } catch (error) {
      console.error('파일 이름 변경 실패:', error);
      throw error;
    }
  };

  const deleteItem = async (node: FileTreeNode) => {
    if (!node || !node.fileId) {
      console.error('deleteItem: 유효하지 않은 node:', node);
      return;
    }

    try {
      if (node.parentId === null) {
        console.warn('루트 레벨 항목 삭제 시도 - 삭제 불가');
        toast.warning('최상위 프로젝트 폴더는 삭제할 수 없습니다.');
        return;
      }

      const deleteMessage = `"${node.fileName}"을(를) 삭제하시겠습니까?${
        node.fileType === 'FOLDER' ? '\n폴더와 하위 모든 파일이 삭제됩니다.' : ''
      }`;

      toast.warning(deleteMessage, 0, true);

      // 사용자 확인을 기다리기 위해 Promise 사용
      const userConfirmed = await new Promise<boolean>(resolve => {
        const confirmButton = document.createElement('button');
        confirmButton.textContent = '삭제';
        confirmButton.style.cssText = `
          margin-left: 8px;
          padding: 4px 8px;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        `;
        confirmButton.onclick = () => {
          resolve(true);
          confirmButton.remove();
          cancelButton.remove();
        };

        const cancelButton = document.createElement('button');
        cancelButton.textContent = '취소';
        cancelButton.style.cssText = `
          margin-left: 4px;
          padding: 4px 8px;
          background: #6b7280;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        `;
        cancelButton.onclick = () => {
          resolve(false);
          confirmButton.remove();
          cancelButton.remove();
        };

        const toastElement = document.querySelector('[data-toast-id]:last-child .toast-content');
        if (toastElement) {
          toastElement.appendChild(confirmButton);
          toastElement.appendChild(cancelButton);
        } else {
          // fallback: 기본 confirm 사용
          resolve(window.confirm(deleteMessage));
        }
      });

      if (!userConfirmed) return;

      console.log('파일 삭제 시작:', {
        fileName: node.fileName,
        fileId: node.fileId,
        fileType: node.fileType,
      });

      await deleteMutation.mutateAsync(node.fileId);

      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess();
      }

      toast.success(`"${node.fileName}"이(가) 삭제되었습니다.`);

      console.log('파일 삭제 완료 - YJS 동기화됨');
    } catch (error) {
      console.error('파일 삭제 실패:', error);
      toast.error('파일 삭제에 실패했습니다.');
      throw error;
    }
  };

  const moveItem = async (
    sourceNode: FileTreeNode,
    targetNode: FileTreeNode | null,
    position?: string
  ) => {
    if (!sourceNode || !sourceNode.fileId) {
      console.error('moveItem: 유효하지 않은 sourceNode:', sourceNode);
      return;
    }

    try {
      // 동적으로 최상위 폴더 ID 계산
      const getRootFolderId = () => {
        if (rootFolderId) return rootFolderId;

        // sourceNode의 path를 분석해서 최상위 폴더 찾기
        const pathParts = sourceNode.path.split('/');
        if (pathParts.length <= 1) {
          // 이미 최상위에 있는 경우
          return sourceNode.parentId;
        }

        // path를 역추적해서 최상위 폴더 ID 찾기
        const currentParentId = sourceNode.parentId;
        let currentPath = sourceNode.path;

        while (currentPath.includes('/')) {
          const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
          if (!parentPath.includes('/')) {
            // 최상위 폴더 발견
            break;
          }
          currentPath = parentPath;
        }

        return currentParentId;
      };

      const dynamicRootFolderId = getRootFolderId();

      console.log('파일 이동 시작:', {
        source: {
          id: sourceNode.fileId,
          name: sourceNode.fileName,
          path: sourceNode.path,
          currentParentId: sourceNode.parentId,
          level: sourceNode.level,
        },
        target: targetNode
          ? {
              id: targetNode.fileId,
              name: targetNode.fileName,
              path: targetNode.path,
              type: targetNode.fileType,
            }
          : 'TOP_LEVEL_FOLDER',
        position,
        rootFolderId,
        dynamicRootFolderId,
      });

      let newParentId: number | null = null;

      if (!targetNode || position === 'root') {
        // 최상위 프로젝트 폴더로 이동
        if (!dynamicRootFolderId) {
          throw new Error('최상위 폴더를 찾을 수 없습니다.');
        }
        newParentId = dynamicRootFolderId;
      } else if (targetNode.fileType === 'FOLDER' && position === 'inside') {
        newParentId = targetNode.fileId;
      } else {
        // before/after 또는 파일의 경우 부모와 같은 레벨
        newParentId = targetNode.parentId;
      }

      if (sourceNode.parentId === newParentId) {
        console.log('동일한 위치로 이동 시도 - 스킵');
        return;
      }

      const result = await moveMutation.mutateAsync({
        fileId: sourceNode.fileId,
        data: { newParentId },
      });

      // 최상위 폴더 이동의 경우 추가 브로드캐스트 (안전장치)
      if (
        (!targetNode || position === 'root') &&
        broadcastFileTreeUpdate &&
        typeof broadcastFileTreeUpdate === 'function'
      ) {
        console.log('최상위 폴더 이동 추가 브로드캐스트 시도');
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

      // 최상위 폴더 이동 성공 메시지
      if (!targetNode || position === 'root') {
        toast.success(`"${sourceNode.fileName}"을(를) 최상위 폴더로 이동했습니다.`);
      }
    } catch (error) {
      console.error('파일 이동 실패:', error);
      toast.error('파일 이동에 실패했습니다.');
      throw error;
    }
  };

  const uploadFiles = async (files: File[], targetPath: string) => {
    if (!files || files.length === 0) {
      console.warn('uploadFiles: 업로드할 파일이 없음');
      return;
    }

    try {
      if (!targetPath) {
        throw new Error('루트에는 파일을 업로드할 수 없습니다. 폴더 안으로 드래그해주세요.');
      }

      console.log('파일 업로드 시작:', {
        fileCount: files.length,
        targetPath,
        fileNames: files.map(f => f.name),
      });

      const uploadPromises = files.map(file =>
        uploadMutation.mutateAsync({
          file,
          parentPath: targetPath,
        })
      );

      await Promise.all(uploadPromises);

      console.log('모든 파일 업로드 완료 - YJS 동기화됨');

      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess();
      }
    } catch (error) {
      console.error('파일 업로드 실패:', error);
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
