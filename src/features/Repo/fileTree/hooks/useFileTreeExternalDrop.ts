import { useState, useCallback, useRef } from 'react';
import type { FileTreeNode } from '../types';

interface ExternalDropState {
  isDragOver: boolean;
  dropTarget: {
    nodeId: string;
    path: string;
    type: 'folder' | 'file' | 'root';
  } | null;
  dragPreview: string | null;
}

interface UseFileTreeExternalDropProps {
  onFileUpload: (files: File[], targetPath: string) => Promise<void>;
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
}: UseFileTreeExternalDropProps): UseFileTreeExternalDropReturn => {
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
    // 내부 드래그(application/json)가 아니고 파일이 포함된 경우
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

  // 타겟 경로 계산
  const calculateTargetPath = useCallback((node: FileTreeNode | null): string => {
    if (!node) return ''; // 루트

    if (node.type === 'folder') {
      return node.path; // 폴더 내부
    } else {
      // 파일과 같은 레벨 (부모 폴더)
      const pathParts = node.path.split('/');
      pathParts.pop();
      return pathParts.join('/');
    }
  }, []);

  // 전체 파일트리 영역 드래그 엔터
  const handleExternalDragEnter = useCallback(
    (e: React.DragEvent) => {
      if (!isExternalFile(e)) return;

      preventDefaultDrop(e);

      // 드래그 진입 시에만 카운터 증가
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
      e.dataTransfer.dropEffect = 'copy';
    },
    [isExternalFile, preventDefaultDrop]
  );

  // 전체 파일트리 영역 드래그 리브
  const handleExternalDragLeave = useCallback(
    (e: React.DragEvent) => {
      if (!isExternalFile(e)) return;

      preventDefaultDrop(e);

      // 더 엄격한 영역 벗어남 감지
      const currentTarget = e.currentTarget as HTMLElement;
      const relatedTarget = e.relatedTarget as HTMLElement;

      // relatedTarget이 현재 요소의 자식이 아닌 경우에만 드래그 리브 처리
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
        }, 150); // 타임아웃을 늘려서 더 안정적으로
      }
    },
    [isExternalFile, preventDefaultDrop]
  );

  // 전체 파일트리 영역 드롭 (빈 공간 = 루트)
  const handleExternalDrop = useCallback(
    async (e: React.DragEvent) => {
      if (!isExternalFile(e)) return;

      preventDefaultDrop(e);

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      try {
        await onFileUpload(files, ''); // 루트 경로
        console.log(`📁 루트에 ${files.length}개 파일 업로드 완료`);
      } catch (error) {
        console.error('파일 업로드 실패:', error);
      } finally {
        // 상태 완전 초기화
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
    [isExternalFile, preventDefaultDrop, onFileUpload]
  );

  // 특정 노드에 드래그 오버
  const handleNodeExternalDragOver = useCallback(
    (node: FileTreeNode, e: React.DragEvent) => {
      if (!isExternalFile(e)) return;

      preventDefaultDrop(e);
      e.dataTransfer.dropEffect = 'copy';

      const targetPath = calculateTargetPath(node);

      setExternalDropState(prev => ({
        ...prev,
        dropTarget: {
          nodeId: node.id,
          path: targetPath,
          type: node.type,
        },
      }));
    },
    [isExternalFile, preventDefaultDrop, calculateTargetPath]
  );

  // 특정 노드에서 드래그 리브
  const handleNodeExternalDragLeave = useCallback(
    (node: FileTreeNode, e: React.DragEvent) => {
      if (!isExternalFile(e)) return;

      preventDefaultDrop(e);

      // 노드에서 벗어났을 때 해당 노드 타겟 해제
      setExternalDropState(prev => ({
        ...prev,
        dropTarget: prev.dropTarget?.nodeId === node.id ? null : prev.dropTarget,
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

      const targetPath = calculateTargetPath(node);

      try {
        await onFileUpload(files, targetPath);

        const locationDesc =
          node.type === 'folder' ? `"${node.name}" 폴더 내부` : `"${node.name}" 파일과 같은 레벨`;

        console.log(`📁 ${locationDesc}에 ${files.length}개 파일 업로드 완료`);
      } catch (error) {
        console.error('파일 업로드 실패:', error);
      } finally {
        // 상태 완전 초기화
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
    [isExternalFile, preventDefaultDrop, calculateTargetPath, onFileUpload]
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
