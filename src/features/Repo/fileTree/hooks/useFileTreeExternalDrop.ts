import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/common/useToast';
import type { FileTreeNode } from '../types';

interface ExternalDropState {
  isDragOver: boolean;
  dropTarget: {
    nodeId: string;
    parentId: number;
    type: 'folder' | 'file' | 'root';
  } | null;
  dragPreview: string | null;
}

interface UseFileTreeExternalDropProps {
  onFileUpload: (files: File[], targetParentId: number) => Promise<void>;
  rootFolderId?: number; // 추가: 최상위 프로젝트 폴더 ID
}

interface UseFileTreeExternalDropReturn {
  externalDropState: ExternalDropState;
  handleExternalDragEnter: (e: React.DragEvent) => void;
  handleExternalDragOver: (e: React.DragEvent) => void;
  handleExternalDragLeave: (e: React.DragEvent) => void;
  handleExternalDrop: (e: React.DragEvent) => void;
  handleNodeExternalDragOver: (node: FileTreeNode, e: React.DragEvent) => void;
  handleNodeExternalDragLeave: (node: FileTreeNode, e: React.DragEvent) => void;
  handleNodeExternalDrop: (node: FileTreeNode, e: React.DragEvent) => void;
  isExternalDragOver: (nodeId: string) => boolean;
}

export const useFileTreeExternalDrop = ({
  onFileUpload,
  rootFolderId,
}: UseFileTreeExternalDropProps): UseFileTreeExternalDropReturn => {
  const toast = useToast();
  const [externalDropState, setExternalDropState] = useState<ExternalDropState>({
    isDragOver: false,
    dropTarget: null,
    dragPreview: null,
  });

  const dragCounterRef = useRef(0);
  const dragLeaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 외부 파일인지 확인하는 함수
  const isExternalFile = useCallback((e: React.DragEvent): boolean => {
    const types = Array.from(e.dataTransfer.types);
    return !types.includes('application/json') && types.includes('Files');
  }, []);

  // 기본 드롭 동작 방지 함수
  const preventDefaultDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // 드래그된 파일 정보 추출
  const getFileInfo = useCallback((e: React.DragEvent): { count: number; preview: string } => {
    const files = Array.from(e.dataTransfer.files);
    const count = files.length;

    if (count === 0) return { count: 0, preview: '' };
    if (count === 1) return { count, preview: files[0].name };

    return { count, preview: `${files[0].name} 외 ${count - 1}개` };
  }, []);

  // 타겟 부모 ID 계산
  const calculateTargetParentId = useCallback(
    (node: FileTreeNode | null): number => {
      if (!node) {
        // 빈 공간(루트)에 드롭하는 경우 → 최상위 프로젝트 폴더에 업로드
        if (!rootFolderId) {
          throw new Error('최상위 폴더 ID를 찾을 수 없습니다.');
        }
        return rootFolderId;
      }

      if (node.fileType === 'FOLDER') {
        return node.fileId; // 폴더 내부에 업로드
      } else {
        // 파일과 같은 레벨 (부모 폴더에 업로드)
        if (!node.parentId) {
          if (!rootFolderId) {
            throw new Error('최상위 폴더 ID를 찾을 수 없습니다.');
          }
          return rootFolderId;
        }
        return node.parentId;
      }
    },
    [rootFolderId]
  );

  // 전체 파일트리 영역 드래그 엔터
  const handleExternalDragEnter = useCallback(
    (e: React.DragEvent) => {
      if (!isExternalFile(e)) return;

      preventDefaultDrop(e);

      if (dragCounterRef.current === 0) {
        dragCounterRef.current = 1;

        if (dragLeaveTimeoutRef.current) {
          clearTimeout(dragLeaveTimeoutRef.current);
          dragLeaveTimeoutRef.current = null;
        }

        const { count, preview } = getFileInfo(e);

        setExternalDropState(prev => ({
          ...prev,
          isDragOver: true,
          dragPreview: count > 0 ? preview : '파일',
        }));
      }
    },
    [isExternalFile, getFileInfo, preventDefaultDrop]
  );

  // 전체 파일트리 영역 드래그 오버
  const handleExternalDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!isExternalFile(e)) return;

      preventDefaultDrop(e);

      if (rootFolderId) {
        e.dataTransfer.dropEffect = 'copy';
      } else {
        e.dataTransfer.dropEffect = 'none';
      }
    },
    [isExternalFile, preventDefaultDrop, rootFolderId]
  );

  // 전체 파일트리 영역 드래그 리브
  const handleExternalDragLeave = useCallback(
    (e: React.DragEvent) => {
      if (!isExternalFile(e)) return;

      preventDefaultDrop(e);

      const currentTarget = e.currentTarget as HTMLElement;
      const relatedTarget = e.relatedTarget as HTMLElement;

      if (!currentTarget.contains(relatedTarget)) {
        dragCounterRef.current = 0;

        if (dragLeaveTimeoutRef.current) {
          clearTimeout(dragLeaveTimeoutRef.current);
        }

        dragLeaveTimeoutRef.current = setTimeout(() => {
          setExternalDropState({
            isDragOver: false,
            dropTarget: null,
            dragPreview: null,
          });
        }, 150);
      }
    },
    [isExternalFile, preventDefaultDrop]
  );

  // 전체 파일트리 영역 드롭 (빈 공간 = 최상위 프로젝트 폴더)
  const handleExternalDrop = useCallback(
    async (e: React.DragEvent) => {
      if (!isExternalFile(e)) return;

      preventDefaultDrop(e);

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      try {
        const targetParentId = calculateTargetParentId(null);
        await onFileUpload(files, targetParentId);

        toast.success(`최상위 프로젝트 폴더에 ${files.length}개 파일 업로드 완료`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '파일 업로드 실패';
        toast.error(errorMessage);
      } finally {
        if (dragLeaveTimeoutRef.current) {
          clearTimeout(dragLeaveTimeoutRef.current);
          dragLeaveTimeoutRef.current = null;
        }

        dragCounterRef.current = 0;
        setExternalDropState({
          isDragOver: false,
          dropTarget: null,
          dragPreview: null,
        });
      }
    },
    [isExternalFile, preventDefaultDrop, calculateTargetParentId, onFileUpload, toast]
  );

  // 특정 노드에 드래그 오버
  const handleNodeExternalDragOver = useCallback(
    (node: FileTreeNode, e: React.DragEvent) => {
      if (!isExternalFile(e)) return;

      preventDefaultDrop(e);

      try {
        const targetParentId = calculateTargetParentId(node);
        e.dataTransfer.dropEffect = 'copy';

        setExternalDropState(prev => ({
          ...prev,
          dropTarget: {
            nodeId: node.fileId.toString(),
            parentId: targetParentId,
            type: node.fileType === 'FOLDER' ? 'folder' : 'file',
          },
        }));
      } catch {
        e.dataTransfer.dropEffect = 'none';
      }
    },
    [isExternalFile, preventDefaultDrop, calculateTargetParentId]
  );

  // 특정 노드에서 드래그 리브
  const handleNodeExternalDragLeave = useCallback(
    (node: FileTreeNode, e: React.DragEvent) => {
      if (!isExternalFile(e)) return;

      preventDefaultDrop(e);

      setExternalDropState(prev => ({
        ...prev,
        dropTarget: prev.dropTarget?.nodeId === node.fileId.toString() ? null : prev.dropTarget,
      }));
    },
    [isExternalFile, preventDefaultDrop]
  );

  // 특정 노드에 드롭
  const handleNodeExternalDrop = useCallback(
    async (node: FileTreeNode, e: React.DragEvent) => {
      if (!isExternalFile(e)) return;

      preventDefaultDrop(e);

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      try {
        const targetParentId = calculateTargetParentId(node);
        await onFileUpload(files, targetParentId);

        const locationDesc =
          node.fileType === 'FOLDER'
            ? `"${node.fileName}" 폴더 내부`
            : `"${node.fileName}" 파일과 같은 레벨`;

        toast.success(`${locationDesc}에 ${files.length}개 파일 업로드 완료`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '파일 업로드 실패';
        toast.error(errorMessage);
      } finally {
        if (dragLeaveTimeoutRef.current) {
          clearTimeout(dragLeaveTimeoutRef.current);
          dragLeaveTimeoutRef.current = null;
        }

        dragCounterRef.current = 0;
        setExternalDropState({
          isDragOver: false,
          dropTarget: null,
          dragPreview: null,
        });
      }
    },
    [isExternalFile, preventDefaultDrop, calculateTargetParentId, onFileUpload, toast]
  );

  // 특정 노드가 드롭 타겟인지 확인
  const isExternalDragOver = useCallback(
    (nodeId: string): boolean => {
      return externalDropState.dropTarget?.nodeId === nodeId;
    },
    [externalDropState.dropTarget]
  );

  return {
    externalDropState,
    handleExternalDragEnter,
    handleExternalDragOver,
    handleExternalDragLeave,
    handleExternalDrop,
    handleNodeExternalDragOver,
    handleNodeExternalDragLeave,
    handleNodeExternalDrop,
    isExternalDragOver,
  };
};
