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
import styles from './FileTree.module.scss';
import type { FileTreeProps, FileTreeNode } from './types';

const FileTree: React.FC<FileTreeProps> = ({ repoId, repositoryId, className = '' }) => {
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

  const { handleFileClick, handleFolderToggle } = useFileTreeActions({
    repoId,
    setExpandedFolders,
    setSelectedFile,
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

    // 클립보드 작업
    canPaste,
    copyNode,
    cutNode,
    pasteNode,

    // 로딩 상태
    isCreating,
    isRenaming,
    isDeleting,
    isMoving,
  } = useFileTreeOperations({
    repositoryId,
    onSuccess: refetch,
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

  // 파일 업로드 핸들러
  const handleFileUpload = async (files: File[], targetPath: string): Promise<void> => {
    try {
      console.log(`📤 파일 업로드 시작:`, {
        files: files.map(f => f.name),
        targetPath: targetPath || '(루트)',
        repositoryId,
      });

      // TODO: 실제 파일 업로드 연결 필요. 생성 API 사용하면 될 듯
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 업로드 성공 후 데이터 새로고침
      refetch();

      console.log(`✅ 파일 업로드 완료: ${files.length}개 파일`);
    } catch (error) {
      console.error('❌ 파일 업로드 실패:', error);
      throw error;
    }
  };

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
    onFileUpload: handleFileUpload,
  });

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

  // 렌더링 함수들
  const renderTreeNodes = (nodes: FileTreeNode[]) => {
    return nodes.map(node => {
      const isExpanded = expandedFolders.has(node.fileId.toString());
      const isSelected = selectedFile === node.path;

      return (
        <React.Fragment key={node.fileId}>
          <FileTreeItem
            node={node}
            isExpanded={isExpanded}
            isSelected={isSelected}
            onFileClick={handleFileClick}
            onFolderToggle={handleFolderToggle}
            // 편집 관련
            isEditing={editingNode === node.fileId.toString()}
            onEditSave={(node: FileTreeNode, newName: string) => renameItem(node, newName)}
            onEditCancel={() => stopEditing()}
            // 컨텍스트 메뉴 액션
            onNewFile={() => openCreateModal('FILE', node)}
            onNewFolder={() => openCreateModal('FOLDER', node)}
            onRename={() => startEditing(node.fileId.toString())}
            onDelete={() => deleteItem(node)}
            onCopy={() => copyNode(node)}
            onCut={() => cutNode(node)}
            onPaste={() => pasteNode(node)}
            canPaste={canPaste}
            // 내부 드래그앤드롭
            isDragging={isDragging(node.fileId.toString())}
            isDropTarget={isDropTarget(node.fileId.toString())}
            canDrop={canDrop(node, node)} // 함수 호출로 수정
            onDragStart={(node, event) => handleDragStart(node, event)}
            onDragEnd={handleDragEnd}
            onDragOver={(node, event) => handleDragOver(node, event)}
            onDragLeave={handleDragLeave}
            onDrop={(node, event) => handleDrop(node, event)}
            getDropPosition={getDropPosition}
            // 외부 파일 드롭
            isExternalDragOver={isExternalDragOver(node.fileId.toString())}
            onExternalDragOver={(node, event) => handleNodeExternalDragOver(node, event)}
            onExternalDragLeave={(node, event) => handleNodeExternalDragLeave(node, event)}
            onExternalDrop={(node, event) => handleNodeExternalDrop(node, event)}
          />
          {node.children && isExpanded && (
            <div className={styles.childrenContainer}>
              {renderTreeNodes(node.children as FileTreeNode[])}
            </div>
          )}
        </React.Fragment>
      );
    });
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className={clsx(styles.fileTree, className)}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner} />
          <span>파일 트리를 불러오는 중...</span>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className={clsx(styles.fileTree, className)}>
        <div className={styles.errorContainer}>
          <span className={styles.errorMessage}>파일 트리를 불러오는데 실패했습니다.</span>
          <button onClick={() => refetch()} className={styles.retryButton}>
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 빈 상태
  if (!treeData || treeData.length === 0) {
    return (
      <FileTreeContextMenu
        onNewFile={() => openCreateModal('FILE')}
        onNewFolder={() => openCreateModal('FOLDER')}
        onPaste={() => pasteNode()}
        canPaste={canPaste}
      >
        <div className={clsx(styles.fileTree, className)}>
          <div className={styles.emptyContainer}>
            <span className={styles.emptyHint}>
              우클릭으로 파일을 생성하거나 파일을 드래그해서 업로드하세요
            </span>
          </div>
        </div>
      </FileTreeContextMenu>
    );
  }

  // 정상 렌더링
  return (
    <>
      <FileTreeContextMenu
        onNewFile={() => openCreateModal('FILE')}
        onNewFolder={() => openCreateModal('FOLDER')}
        onPaste={() => pasteNode()}
        canPaste={canPaste}
      >
        <div
          className={clsx(styles.fileTree, className, {
            [styles.dragging]: dragDropState.isDragging,
            [styles.externalDragOver]: externalDropState.isDragOver,
            [styles.loading]: isCreating || isRenaming || isDeleting || isMoving,
          })}
          data-file-tree-container
          onDragEnter={handleCombinedDragEnter}
          onDragOver={handleCombinedDragOver}
          onDragLeave={handleCombinedDragLeave}
          onDrop={handleCombinedDrop}
        >
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
          {(isCreating || isRenaming || isDeleting || isMoving) && (
            <div className={styles.operationIndicator}>
              <div className={styles.loadingSpinner} />
              <span>
                {isCreating && '생성 중...'}
                {isRenaming && '이름 변경 중...'}
                {isDeleting && '삭제 중...'}
                {isMoving && '이동 중...'}
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
