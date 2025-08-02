'use client';

import React, { useEffect } from 'react';
import clsx from 'clsx';
import FileTreeItem from './components/FileTreeItem/FileTreeItem';
import FileTreeContextMenu from './components/FileTreeContextMenu/FileTreeContextMenu';
import CreateFileModal from './components/CreateFileModal/CreateFileModal';
import { useFileTree } from './hooks/useFileTree';
import { useFileTreeActions } from './hooks/useFileTreeActions';
import { useFileTreeOperations } from './hooks/useFileTreeOperations';
import { useFileTreeDragDrop } from './hooks/useFileTreeDragDrop';
import { useFileTreeExternalDrop } from './hooks/useFileTreeExternalDrop';
import { useYjsFileTree } from '@/hooks/repo/useYjsFileTree';
import styles from './FileTree.module.scss';
import type { FileTreeProps, FileTreeNode } from './types';

// props에 협업 모드 지원
interface ExtendedFileTreeProps extends FileTreeProps {
  enableCollaboration?: boolean;
}

const FileTree: React.FC<ExtendedFileTreeProps> = ({
  repoId,
  repositoryId,
  className = '',
  enableCollaboration = false, // 기본값 false
}) => {
  const {
    treeData,
    expandedFolders,
    setExpandedFolders,
    selectedFile,
    setSelectedFile,
    isLoading,
    error,
    refetch,
  } = useFileTree({ repositoryId });

  // YJS 훅
  const { yMap } = useYjsFileTree(repositoryId);

  //  enableCollaboration을 useFileTreeActions에 전달
  const { handleFileClick, handleFolderToggle } = useFileTreeActions({
    repoId,
    repositoryId,
    setExpandedFolders,
    setSelectedFile,
    enableCollaboration, // 협업 모드 전달
  });

  const {
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
    isCreating,
    isRenaming,
    isDeleting,
    isMoving,
    isUploading,
  } = useFileTreeOperations({
    repositoryId,
    onSuccess: refetch,
    rootFolderId: treeData?.[0]?.fileId,
  });

  // 내부 드래그앤드롭 훅
  const {
    dragDropState,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    isDragging,
    isDropTarget,
    getDropPosition,
    canDrop,
  } = useFileTreeDragDrop({
    onMoveNode: moveItem,
  });

  // 외부 파일 드롭 훅
  const {
    externalDropState,
    handleExternalDragEnter,
    handleExternalDragOver,
    handleExternalDragLeave,
    handleExternalDrop,
    handleNodeExternalDragOver,
    handleNodeExternalDragLeave,
    handleNodeExternalDrop,
    isExternalDragOver,
  } = useFileTreeExternalDrop({
    onFileUpload: uploadFiles, // 실제 API 업로드 함수 연결
  });

  // YJS 파일트리 변경사항 실시간 동기화
  useEffect(() => {
    if (!yMap) return;

    const handleYjsUpdate = () => {
      // YJS에서 파일트리가 업데이트되면 React Query 캐시도 업데이트
      const updatedFileTree = yMap.get('fileTree');
      const lastUpdated = yMap.get('lastUpdated');

      if (updatedFileTree && lastUpdated) {
        console.log('YJS 파일트리 업데이트 감지:', updatedFileTree);
        // React Query 데이터 갱신
        refetch();
      }
    };

    // YJS 변경사항 감지
    yMap.observe(handleYjsUpdate);

    // 초기 데이터 로드 시에도 확인
    handleYjsUpdate();

    return () => {
      yMap.unobserve(handleYjsUpdate);
    };
  }, [yMap, refetch]);

  // 협업 모드 상태 로깅
  useEffect(() => {
    console.log('FileTree 상태:', {
      repoId,
      repositoryId,
      enableCollaboration,
      treeDataLength: treeData?.length || 0,
      hasYjsMap: !!yMap,
    });
  }, [repoId, repositoryId, enableCollaboration, treeData?.length, yMap]);

  // 전역 드래그 이벤트 방지 (파일 자동 열림 완전 차단)
  useEffect(() => {
    const preventGlobalDrop = (e: DragEvent) => {
      // FileTree 영역 밖에서의 드롭을 방지
      if (!(e.target as HTMLElement)?.closest('[data-file-tree-container]')) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const preventGlobalDragOver = (e: DragEvent) => {
      // FileTree 영역 밖에서의 드래그오버를 방지
      if (!(e.target as HTMLElement)?.closest('[data-file-tree-container]')) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('dragover', preventGlobalDragOver);
    document.addEventListener('drop', preventGlobalDrop);

    return () => {
      document.removeEventListener('dragover', preventGlobalDragOver);
      document.removeEventListener('drop', preventGlobalDrop);
    };
  }, []);

  // 통합 드래그 이벤트 핸들러들
  const handleCombinedDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 내부/외부 드래그 구분해서 처리
    if (e.dataTransfer.types.includes('application/x-file-tree-node')) {
      // 내부 드래그: 별도 처리 없음 (개별 노드에서 처리)
    } else {
      // 외부 파일 드래그
      handleExternalDragEnter(e);
    }
  };

  const handleCombinedDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.types.includes('application/x-file-tree-node')) {
      // 내부 드래그: 별도 처리 없음
    } else {
      // 외부 파일 드래그
      handleExternalDragOver(e);
    }
  };

  const handleCombinedDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.types.includes('application/x-file-tree-node')) {
      // 내부 드래그
    } else {
      // 외부 파일 드래그
      handleExternalDragLeave(e);
    }
  };

  const handleCombinedDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.types.includes('application/x-file-tree-node')) {
      // 내부 드래그: 개별 노드에서 처리됨
    } else {
      // 외부 파일 드래그
      handleExternalDrop(e);
    }
  };

  // 렌더링 함수들 (안전성 강화)
  const renderTreeNodes = (nodes: FileTreeNode[]): React.ReactNode => {
    // nodes 배열과 각 node의 유효성 검사
    if (!nodes || !Array.isArray(nodes)) {
      return null;
    }

    return nodes
      .map(node => {
        // node와 필수 속성들의 유효성 검사
        if (!node || typeof node.fileId === 'undefined' || !node.fileName) {
          console.warn('유효하지 않은 파일 트리 노드:', node);
          return null;
        }

        const isExpanded = expandedFolders.has(node.fileId.toString());
        const isSelected = selectedFile === node.path;

        return (
          <React.Fragment key={`${node.fileId}-${node.fileName}`}>
            <FileTreeItem
              node={node}
              isExpanded={isExpanded}
              isSelected={isSelected}
              onFileClick={handleFileClick}
              onFolderToggle={handleFolderToggle}
              // 컨텍스트 메뉴
              onNewFile={(parentNode?: FileTreeNode) => openCreateModal('FILE', parentNode)}
              onNewFolder={(parentNode?: FileTreeNode) => openCreateModal('FOLDER', parentNode)}
              onRename={(targetNode: FileTreeNode) => startEditing(targetNode.fileId.toString())}
              onDelete={deleteItem}
              // 인라인 편집
              isEditing={editingNode === node.fileId.toString()}
              onEditSave={renameItem}
              onEditCancel={stopEditing}
              // 내부 드래그앤드롭
              isDragging={isDragging(node.fileId.toString())}
              isDropTarget={isDropTarget(node.fileId.toString())}
              canDrop={canDrop(node, node)} // 실제로는 드래그되는 노드와 비교해야 하지만 일단 기본값
              onDragStart={(nodeParam: FileTreeNode, event: React.DragEvent) =>
                handleDragStart(nodeParam, event)
              }
              onDragEnd={handleDragEnd}
              onDragOver={(nodeParam: FileTreeNode, event: React.DragEvent) =>
                handleDragOver(nodeParam, event)
              }
              onDragLeave={handleDragLeave}
              onDrop={(nodeParam: FileTreeNode, event: React.DragEvent) =>
                handleDrop(nodeParam, event)
              }
              getDropPosition={getDropPosition}
              // 외부 파일 드롭
              isExternalDragOver={isExternalDragOver(node.fileId.toString())}
              onExternalDragOver={handleNodeExternalDragOver}
              onExternalDragLeave={handleNodeExternalDragLeave}
              onExternalDrop={handleNodeExternalDrop}
            />
            {/* 자식 노드 렌더링 */}
            {node.fileType === 'FOLDER' &&
              isExpanded &&
              node.children &&
              Array.isArray(node.children) &&
              node.children.length > 0 && (
                <div className={styles.childrenContainer}>
                  {renderTreeNodes(node.children as FileTreeNode[])}
                </div>
              )}
          </React.Fragment>
        );
      })
      .filter(Boolean); // null 값 제거
  };

  // 🔧 추가: 협업 모드 인디케이터
  const renderCollaborationIndicator = (): React.ReactNode => {
    if (!enableCollaboration) return null;

    return (
      <div className={styles.collaborationIndicator}>
        <span className={styles.collaborationIcon}>🤝</span>
        <span className={styles.collaborationText}>실시간 협업 활성</span>
      </div>
    );
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className={clsx(styles.fileTree, className)}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
          <span>파일 트리 로딩 중...</span>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className={clsx(styles.fileTree, className)}>
        <div className={styles.errorState}>
          <span className={styles.errorIcon}>⚠️</span>
          <span>파일 트리를 불러올 수 없습니다.</span>
          <button onClick={refetch} className={styles.retryButton}>
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 빈 트리 데이터 체크
  if (!treeData || treeData.length === 0) {
    return (
      <div className={clsx(styles.fileTree, className)}>
        <div className={styles.emptyState}>
          <span>파일이 없습니다.</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <FileTreeContextMenu
        onNewFile={(parentNode?: FileTreeNode) => openCreateModal('FILE', parentNode)}
        onNewFolder={(parentNode?: FileTreeNode) => openCreateModal('FOLDER', parentNode)}
      >
        <div
          className={clsx(styles.fileTree, className, {
            [styles.loading]: isCreating || isRenaming || isDeleting || isMoving || isUploading,
            [styles.collaborationMode]: enableCollaboration, // 협업 모드 CSS 클래스
          })}
          data-file-tree-container
          onDragEnter={handleCombinedDragEnter}
          onDragOver={handleCombinedDragOver}
          onDragLeave={handleCombinedDragLeave}
          onDrop={handleCombinedDrop}
        >
          {/* 업 모드 인디케이터 */}
          {renderCollaborationIndicator()}

          <div className={clsx(styles.treeContainer, styles.dropZone)}>
            {renderTreeNodes(treeData)}
          </div>

          {/* 내부 드래그 프리뷰 표시 */}
          {dragDropState.isDragging && dragDropState.dragPreview && (
            <div className={styles.dragIndicator}>📄 {dragDropState.dragPreview} 이동 중...</div>
          )}

          {/* 외부 파일 드래그 프리뷰 표시 */}
          {externalDropState.isDragOver && externalDropState.dragPreview && (
            <div className={styles.externalDragIndicator}>
              📤 {externalDropState.dragPreview} 업로드 준비
            </div>
          )}

          {/* 로딩 인디케이터 */}
          {(isCreating || isRenaming || isDeleting || isMoving || isUploading) && (
            <div className={styles.operationIndicator}>
              <div className={styles.loadingSpinner} />
              <span>
                {isCreating && '생성 중...'}
                {isRenaming && '이름 변경 중...'}
                {isDeleting && '삭제 중...'}
                {isMoving && '이동 중...'}
                {isUploading && '업로드 중...'}
              </span>
            </div>
          )}
        </div>
      </FileTreeContextMenu>

      {/* 파일/폴더 생성 모달 */}
      {createModalType && (
        <CreateFileModal
          open={createModalOpen}
          onOpenChange={closeCreateModal}
          type={createModalType}
          parentNode={createModalParent || undefined}
          onConfirm={createItem}
          onCancel={closeCreateModal}
        />
      )}
    </>
  );
};

export default FileTree;
