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
  enableCollaboration = false,
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
  } = useFileTree({ repositoryId: repositoryId || 0 });

  // YJS 훅 (협업 모드에서만 활성화)
  const { yMap } = useYjsFileTree(repositoryId || 0);

  // enableCollaboration을 useFileTreeActions에 전달
  const { handleFileClick, handleFolderToggle } = useFileTreeActions({
    repoId,
    repositoryId,
    setExpandedFolders,
    setSelectedFile,
    enableCollaboration,
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
    repositoryId: repositoryId || 0,
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
  } = useFileTreeExternalDrop({
    onFileUpload: uploadFiles,
  });

  // YJS 파일트리 변경사항 실시간 동기화 (협업 모드에서만)
  useEffect(() => {
    if (!enableCollaboration || !yMap) return;

    const handleYjsUpdate = () => {
      const updatedFileTree = yMap.get('fileTree');
      const lastUpdated = yMap.get('lastUpdated');

      if (updatedFileTree && lastUpdated) {
        console.log('YJS 파일트리 업데이트 감지:', {
          enableCollaboration,
          updatedFileTree: !!updatedFileTree,
          lastUpdated,
        });

        // React Query 데이터 갱신
        refetch();
      }
    };

    console.log('YJS 파일트리 변경사항 감지 시작');
    yMap.observe(handleYjsUpdate);

    // 초기 데이터 로드 시에도 확인
    handleYjsUpdate();

    return () => {
      console.log('YJS 파일트리 변경사항 감지 정리');
      yMap.unobserve(handleYjsUpdate);
    };
  }, [yMap, refetch, enableCollaboration]);

  // 협업 모드 상태 로깅
  useEffect(() => {
    console.log('FileTree 상태:', {
      repoId,
      repositoryId,
      enableCollaboration,
      treeDataLength: treeData?.length || 0,
      hasYjsMap: !!yMap,
      isLoading,
      hasError: !!error,
    });
  }, [repoId, repositoryId, enableCollaboration, treeData?.length, yMap, isLoading, error]);

  // 전역 드래그 이벤트 방지 (파일 자동 열림 완전 차단)
  useEffect(() => {
    const preventGlobalDrop = (e: DragEvent) => {
      if (!(e.target as HTMLElement)?.closest('[data-file-tree-container]')) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const preventGlobalDragOver = (e: DragEvent) => {
      if (!(e.target as HTMLElement)?.closest('[data-file-tree-container]')) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('drop', preventGlobalDrop);
    document.addEventListener('dragover', preventGlobalDragOver);

    return () => {
      document.removeEventListener('drop', preventGlobalDrop);
      document.removeEventListener('dragover', preventGlobalDragOver);
    };
  }, []);

  // 협업 모드 표시 컴포넌트
  const renderCollaborationStatus = () => {
    if (!enableCollaboration) return null;

    return (
      <div className={styles.collaborationStatus}>
        <span className={styles.collaborationIcon}>🤝</span>
        <span className={styles.collaborationText}>실시간 협업 활성</span>
        {yMap && <span className={styles.collaborationConnected}>✓</span>}
      </div>
    );
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className={clsx(styles.fileTree, className)}>
        {renderCollaborationStatus()}
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
        {renderCollaborationStatus()}
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
        {renderCollaborationStatus()}
        <div className={styles.emptyState}>
          <span>파일이 없습니다.</span>
          <button onClick={() => openCreateModal('FILE')} className={styles.createFirstFileButton}>
            첫 번째 파일 만들기
          </button>
        </div>
      </div>
    );
  }

  // node 객체를 찾는 헬퍼 함수
  const findNodeById = (nodes: FileTreeNode[], nodeId: string): FileTreeNode | null => {
    for (const node of nodes) {
      if (node.fileId.toString() === nodeId) {
        return node;
      }
      if (node.children) {
        const found = findNodeById(node.children as FileTreeNode[], nodeId);
        if (found) return found;
      }
    }
    return null;
  };

  // 외부 드래그 상태 확인 함수
  const isExternalDragActive = () => {
    return externalDropState.isDragOver;
  };

  // 트리 렌더링 함수
  const renderTreeNodes = (nodes: FileTreeNode[], level = 0) => {
    return nodes.map(node => {
      // children을 미리 계산
      const childrenElements =
        node.children && node.children.length > 0 && expandedFolders.has(node.fileId.toString())
          ? renderTreeNodes(node.children as FileTreeNode[], level + 1)
          : null;

      return (
        <React.Fragment key={node.fileId}>
          <FileTreeItem
            node={node}
            level={level}
            isExpanded={expandedFolders.has(node.fileId.toString())}
            isSelected={selectedFile === node.path}
            // 파일/폴더 액션
            onFileClick={handleFileClick}
            onFolderToggle={handleFolderToggle}
            // 컨텍스트 메뉴
            onNewFile={parentNode => openCreateModal('FILE', parentNode)}
            onNewFolder={parentNode => openCreateModal('FOLDER', parentNode)}
            onRename={node => startEditing(node.fileId.toString())}
            onDelete={deleteItem}
            // 인라인 편집
            isEditing={editingNode === node.fileId.toString()}
            onEditSave={(node, newName) => renameItem(node, newName)}
            onEditCancel={stopEditing}
            // 내부 드래그앤드롭
            isDragging={isDragging(node.fileId.toString())}
            isDropTarget={isDropTarget(node.fileId.toString())}
            canDrop={(() => {
              if (!dragDropState.draggedItem) return false;
              const draggedNode = findNodeById(treeData, dragDropState.draggedItem.id);
              return draggedNode ? canDrop(draggedNode, node) : false;
            })()}
            onDragStart={(node, e) => handleDragStart(node, e)}
            onDragEnd={handleDragEnd}
            onDragOver={(node, e) => handleDragOver(node, e)}
            onDragLeave={handleDragLeave}
            onDrop={(node, e) => handleDrop(node, e)}
            getDropPosition={nodeId => getDropPosition(nodeId)}
            // 외부 파일 드롭
            isExternalDragOver={
              externalDropState.dropTarget?.nodeId === node.fileId.toString() ||
              (externalDropState.isDragOver && !externalDropState.dropTarget)
            }
            onExternalDragOver={(node, e) => handleNodeExternalDragOver(node, e)}
            onExternalDragLeave={(node, e) => handleNodeExternalDragLeave(node, e)}
            onExternalDrop={(node, e) => handleNodeExternalDrop(node, e)}
          />
          {childrenElements}
        </React.Fragment>
      );
    });
  };

  return (
    <>
      <div
        className={clsx(styles.fileTree, className, {
          [styles.collaborationMode]: enableCollaboration,
        })}
        data-file-tree-container
        onDragEnter={handleExternalDragEnter}
        onDragOver={handleExternalDragOver}
        onDragLeave={handleExternalDragLeave}
        onDrop={handleExternalDrop}
      >
        {/* 파일 트리 내용 */}
        <div className={styles.treeContent}>{renderTreeNodes(treeData)}</div>

        {/* 로딩 인디케이터 */}
        {(isCreating || isRenaming || isDeleting || isMoving || isUploading) && (
          <div className={styles.operationLoading}>
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

        {/* 외부 드래그 피드백 */}
        {isExternalDragActive() && (
          <div className={styles.dragOverlay}>
            <div className={styles.dragMessage}>
              <span className={styles.dragIcon}>📁</span>
              <span>파일을 여기에 놓으세요</span>
            </div>
          </div>
        )}
      </div>

      {/* 컨텍스트 메뉴 */}
      <FileTreeContextMenu
        onNewFile={(parentNode?: FileTreeNode) => openCreateModal('FILE', parentNode)}
        onNewFolder={(parentNode?: FileTreeNode) => openCreateModal('FOLDER', parentNode)}
      >
        <div />
      </FileTreeContextMenu>

      {/* 파일/폴더 생성 모달 */}
      {createModalOpen && createModalType && (
        <CreateFileModal
          open={createModalOpen}
          onOpenChange={open => {
            if (!open) closeCreateModal();
          }}
          type={createModalType}
          parentNode={createModalParent || undefined}
          onConfirm={name => {
            createItem(name)
              .then(() => {
                closeCreateModal();
              })
              .catch(error => {
                console.error('파일 생성 실패:', error);
              });
          }}
          onCancel={closeCreateModal}
        />
      )}
    </>
  );
};

export default FileTree;

// 명시적 export도 추가
export { FileTree };
