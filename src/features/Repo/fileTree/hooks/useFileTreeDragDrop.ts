import { useState, useCallback, useRef } from 'react';
import type { FileTreeNode, DragItem, DragDropState } from '../types';
import type { DropPosition } from '../types';

interface UseFileTreeDragDropProps {
  onMoveNode: (
    draggedNode: FileTreeNode,
    targetNode: FileTreeNode | null,
    position: 'inside' | 'before' | 'after' | 'root'
  ) => Promise<void>;
}

interface UseFileTreeDragDropReturn {
  dragDropState: DragDropState;
  handleDragStart: (node: FileTreeNode, event: React.DragEvent) => void;
  handleDragEnd: () => void;
  handleDragOver: (node: FileTreeNode, event: React.DragEvent) => void;
  handleDragLeave: () => void;
  handleDrop: (node: FileTreeNode, event: React.DragEvent) => void;
  handleContainerDragOver: (event: React.DragEvent) => void;
  handleContainerDrop: (event: React.DragEvent) => void;
  isDragging: (nodeId: string) => boolean;
  isDropTarget: (nodeId: string) => boolean;
  getDropPosition: (nodeId: string) => DropPosition | null;
  canDrop: (draggedNode: FileTreeNode, targetNode: FileTreeNode | null) => boolean;
  isRootDropTarget: boolean;
}

export const useFileTreeDragDrop = ({
  onMoveNode,
}: UseFileTreeDragDropProps): UseFileTreeDragDropReturn => {
  const [dragDropState, setDragDropState] = useState<DragDropState>({
    draggedItem: null,
    dropTarget: null,
    isDragging: false,
    dragPreview: null,
  });

  const [dropPosition, setDropPosition] = useState<{
    nodeId: string;
    position: DropPosition;
  } | null>(null);

  const [isRootDropTarget, setIsRootDropTarget] = useState(false);
  const dragOverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 드롭 가능 여부 확인
  const canDrop = useCallback(
    (draggedNode: FileTreeNode, targetNode: FileTreeNode | null): boolean => {
      // 최상위 프로젝트 폴더로 이동하는 경우
      if (!targetNode) {
        // 이미 최상위 프로젝트 폴더에 있는 경우 이동 불가 (level 1 체크)
        return draggedNode.level > 1;
      }

      // 자기 자신에게는 드롭 불가
      if (draggedNode.fileId === targetNode.fileId) {
        return false;
      }

      // 자신의 하위 폴더로는 이동 불가 (무한 루프 방지)
      if (draggedNode.fileType === 'FOLDER' && targetNode.path.startsWith(draggedNode.path + '/')) {
        return false;
      }

      // 같은 부모를 가진 경우 체크
      if (targetNode.fileType === 'FOLDER') {
        // 폴더로 드롭하려는데 이미 그 폴더 안에 있는 경우
        if (draggedNode.parentId === targetNode.fileId) {
          console.log('⚠️ 이미 해당 폴더에 있는 파일입니다');
          return false;
        }
      } else {
        // 파일과 같은 레벨로 드롭하려는데 이미 같은 레벨에 있는 경우
        if (draggedNode.parentId === targetNode.parentId) {
          console.log('⚠️ 이미 같은 레벨에 있는 파일입니다');
          return false;
        }
      }

      return true;
    },
    []
  );

  // 드롭 위치 계산
  const calculateDropPosition = useCallback(
    (event: React.DragEvent, targetNode: FileTreeNode): DropPosition => {
      if (targetNode.fileType === 'FOLDER') {
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        const y = event.clientY - rect.top;
        const height = rect.height;

        // 폴더의 경우 상단 25%, 하단 25%는 before/after, 중간 50%는 inside
        if (y < height * 0.25) {
          return 'before';
        } else if (y > height * 0.75) {
          return 'after';
        } else {
          return 'inside';
        }
      } else {
        // 파일의 경우 상단/하단으로만 구분
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        const y = event.clientY - rect.top;
        const height = rect.height;

        return y < height * 0.5 ? 'before' : 'after';
      }
    },
    []
  );

  // 드래그 시작
  const handleDragStart = useCallback((node: FileTreeNode, event: React.DragEvent) => {
    const dragItem: DragItem = {
      id: node.fileId.toString(),
      type: node.fileType === 'FOLDER' ? 'folder' : 'file',
      path: node.path,
      name: node.fileName,
      node,
    };

    // 드래그 데이터 설정
    event.dataTransfer.setData('application/json', JSON.stringify(dragItem));
    event.dataTransfer.effectAllowed = 'move';

    // 커스텀 드래그 이미지 설정
    const dragImage = document.createElement('div');
    dragImage.textContent = `${node.fileType === 'FOLDER' ? '📁' : '📄'} ${node.fileName}`;
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    dragImage.style.padding = '4px 8px';
    dragImage.style.backgroundColor = '#2563eb';
    dragImage.style.color = 'white';
    dragImage.style.borderRadius = '4px';
    dragImage.style.fontSize = '12px';
    document.body.appendChild(dragImage);

    event.dataTransfer.setDragImage(dragImage, 10, 10);

    // 드래그 이미지 정리
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);

    setDragDropState(prev => ({
      ...prev,
      draggedItem: dragItem,
      isDragging: true,
      dragPreview: node.fileName,
    }));
  }, []);

  // 드래그 종료
  const handleDragEnd = useCallback(() => {
    if (dragOverTimeoutRef.current) {
      clearTimeout(dragOverTimeoutRef.current);
      dragOverTimeoutRef.current = null;
    }

    setDragDropState({
      draggedItem: null,
      dropTarget: null,
      isDragging: false,
      dragPreview: null,
    });

    setDropPosition(null);
    setIsRootDropTarget(false);
  }, []);

  // 드래그 오버 (개별 노드)
  const handleDragOver = useCallback(
    (node: FileTreeNode, event: React.DragEvent) => {
      event.preventDefault();

      const { draggedItem } = dragDropState;
      if (!draggedItem || !canDrop(draggedItem.node, node)) {
        event.dataTransfer.dropEffect = 'none';
        return;
      }

      event.dataTransfer.dropEffect = 'move';

      // 드롭 위치 계산
      const position = calculateDropPosition(event, node);

      setDragDropState(prev => ({
        ...prev,
        dropTarget: {
          id: node.fileId.toString(),
          path: node.path,
          canDrop: true,
        },
      }));

      setDropPosition({
        nodeId: node.fileId.toString(),
        position,
      });

      setIsRootDropTarget(false);
    },
    [dragDropState, canDrop, calculateDropPosition]
  );

  // 컨테이너 드래그 오버 (빈 공간)
  const handleContainerDragOver = useCallback(
    (event: React.DragEvent) => {
      const { draggedItem } = dragDropState;
      if (!draggedItem) return;

      // 내부 드래그가 아닌 경우 처리하지 않음
      const isInternalDrag = event.dataTransfer.types.includes('application/json');
      if (!isInternalDrag) return;

      // 이벤트가 특정 노드에서 발생한 경우 처리하지 않음
      const target = event.target as HTMLElement;
      const isOnNode = target.closest('[data-file-tree-item]');
      if (isOnNode) return;

      event.preventDefault();

      // 루트로 이동 가능한지 확인
      if (canDrop(draggedItem.node, null)) {
        event.dataTransfer.dropEffect = 'move';
        setIsRootDropTarget(true);
        setDragDropState(prev => ({
          ...prev,
          dropTarget: null,
        }));
        setDropPosition(null);
      } else {
        event.dataTransfer.dropEffect = 'none';
        setIsRootDropTarget(false);
      }
    },
    [dragDropState, canDrop]
  );

  // 컨테이너 드롭 (빈 공간)
  const handleContainerDrop = useCallback(
    async (event: React.DragEvent) => {
      const { draggedItem } = dragDropState;
      if (!draggedItem) return;

      // 내부 드래그가 아닌 경우 처리하지 않음
      const isInternalDrag = event.dataTransfer.types.includes('application/json');
      if (!isInternalDrag) return;

      // 이벤트가 특정 노드에서 발생한 경우 처리하지 않음
      const target = event.target as HTMLElement;
      const isOnNode = target.closest('[data-file-tree-item]');
      if (isOnNode) return;

      event.preventDefault();

      if (!canDrop(draggedItem.node, null)) {
        return;
      }

      try {
        console.log('🎯 루트로 드롭:', {
          draggedItem: draggedItem.name,
          currentParentId: draggedItem.node.parentId,
        });

        await onMoveNode(draggedItem.node, null, 'root');

        console.log(`✅ 루트로 이동 완료: ${draggedItem.name}`);
      } catch (error) {
        console.error('❌ 루트로 이동 실패:', error);
      } finally {
        handleDragEnd();
      }
    },
    [dragDropState, canDrop, onMoveNode, handleDragEnd]
  );

  // 드래그 리브
  const handleDragLeave = useCallback(() => {
    if (dragOverTimeoutRef.current) {
      clearTimeout(dragOverTimeoutRef.current);
    }

    dragOverTimeoutRef.current = setTimeout(() => {
      setDragDropState(prev => ({
        ...prev,
        dropTarget: null,
      }));
      setDropPosition(null);
      setIsRootDropTarget(false);
    }, 50);
  }, []);

  // 드롭 (개별 노드)
  const handleDrop = useCallback(
    async (node: FileTreeNode, event: React.DragEvent) => {
      event.preventDefault();

      const { draggedItem } = dragDropState;
      if (!draggedItem || !canDrop(draggedItem.node, node)) {
        return;
      }

      try {
        // 드롭 위치 계산
        const position = calculateDropPosition(event, node);

        console.log('🎯 드롭 상세 정보:', {
          draggedItem: draggedItem.name,
          targetNode: node.fileName,
          position,
          targetType: node.fileType,
        });

        await onMoveNode(draggedItem.node, node, position);

        console.log(`✅ 이동 완료: ${draggedItem.name} → ${node.path} (${position})`);
      } catch (error) {
        console.error('❌ 파일 이동 실패:', error);
      } finally {
        handleDragEnd();
      }
    },
    [dragDropState, canDrop, calculateDropPosition, onMoveNode, handleDragEnd]
  );

  // 헬퍼 함수들
  const isDragging = useCallback(
    (nodeId: string): boolean => {
      return dragDropState.draggedItem?.id === nodeId;
    },
    [dragDropState.draggedItem]
  );

  const isDropTarget = useCallback(
    (nodeId: string): boolean => {
      return dragDropState.dropTarget?.id === nodeId && dragDropState.dropTarget.canDrop;
    },
    [dragDropState.dropTarget]
  );

  const getDropPosition = useCallback(
    (nodeId: string): DropPosition | null => {
      return dropPosition?.nodeId === nodeId ? dropPosition.position : null;
    },
    [dropPosition]
  );

  return {
    dragDropState,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleContainerDragOver,
    handleContainerDrop,
    isDragging,
    isDropTarget,
    getDropPosition,
    canDrop,
    isRootDropTarget,
  };
};
