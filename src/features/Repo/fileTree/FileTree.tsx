'use client';

import React, { useEffect, useCallback } from 'react';
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
import { useTabStore } from '@/stores/tabStore';
import { isValidNode, getNodeId, findNodeById, filterValidNodes, debugNode } from './helpers';
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

  // YJS는 협업 모드에서만 활성화
  const { yMap, needsRefresh, clearRefreshFlag } = useYjsFileTree(repositoryId || 0);

  // 탭 스토어 추가
  const { syncTabsWithFileTree } = useTabStore();

  const { handleFileClick, handleFolderToggle } = useFileTreeActions({
    repoId,
    repositoryId,
    setExpandedFolders,
    setSelectedFile,
    enableCollaboration,
  });

  // 협업 모드별 성공 핸들러
  const handleOperationSuccess = useCallback(() => {
    if (enableCollaboration) {
      console.log('협업 모드: YJS 브로드캐스트 완료, 자동 동기화 대기');
    } else {
      console.log('일반 모드: 직접 refetch 호출');
      setTimeout(() => refetch(), 100);
    }
  }, [enableCollaboration, refetch]);

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
    onSuccess: handleOperationSuccess,
    rootFolderId: treeData?.[0]?.fileId || undefined,
  });

  // 내부 드래그앤드롭 훅
  const {
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
    rootFolderId: treeData?.find(node => node.parentId === null)?.fileId,
  });

  // 파일트리 데이터가 변경될 때마다 탭과 동기화
  useEffect(() => {
    if (treeData && treeData.length > 0) {
      const flattenNodes = (
        nodes: FileTreeNode[]
      ): Array<{ fileId: number; fileName: string; path: string }> => {
        const result: Array<{ fileId: number; fileName: string; path: string }> = [];

        const traverse = (nodeList: FileTreeNode[]) => {
          for (const node of nodeList) {
            if (node.fileType === 'FILE') {
              result.push({
                fileId: node.fileId,
                fileName: node.fileName,
                path: node.path,
              });
            }
            if (node.children && node.children.length > 0) {
              traverse(node.children as FileTreeNode[]);
            }
          }
        };

        traverse(nodes);
        return result;
      };

      const fileNodes = flattenNodes(treeData);
      console.log('파일트리 변경 감지 - 탭 동기화:', {
        fileCount: fileNodes.length,
        repositoryId,
      });

      syncTabsWithFileTree(fileNodes);
    }
  }, [treeData, syncTabsWithFileTree, repositoryId]);

  // YJS 파일트리 실시간 동기화
  useEffect(() => {
    if (!enableCollaboration || !yMap || !needsRefresh || !clearRefreshFlag) return;

    const checkForUpdates = () => {
      if (needsRefresh()) {
        console.log('YJS 파일트리 업데이트 감지 - React Query 갱신');
        refetch();
        clearRefreshFlag();
      }
    };

    const handleYjsUpdate = () => {
      checkForUpdates();
    };

    console.log('YJS 파일트리 실시간 동기화 활성화');
    yMap.observe(handleYjsUpdate);

    checkForUpdates();

    const interval = setInterval(checkForUpdates, 1000);

    return () => {
      console.log('YJS 파일트리 실시간 동기화 정리');
      yMap.unobserve(handleYjsUpdate);
      clearInterval(interval);
    };
  }, [yMap, refetch, enableCollaboration, needsRefresh, clearRefreshFlag]);

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

  // 외부 드래그 오버레이 관리
  useEffect(() => {
    const fileTreeContainer = document.querySelector('[data-file-tree-container]');
    if (!fileTreeContainer) return;

    const cleanupOverlay = () => {
      const existingOverlay = fileTreeContainer.querySelector('.file-tree-drag-overlay');
      if (existingOverlay) {
        existingOverlay.remove();
      }
    };

    if (externalDropState.isDragOver && !externalDropState.dropTarget) {
      cleanupOverlay();

      const overlay = document.createElement('div');
      overlay.className = 'file-tree-drag-overlay';
      overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border: 3px dashed var(--filetree-external-drag-border);
        border-radius: 12px;
        background: transparent;
        animation: external-drag-border-pulse 2s ease-in-out infinite;
        pointer-events: none;
        z-index: 1;
      `;

      fileTreeContainer.appendChild(overlay);
      console.log('전체 영역 오버레이 생성됨');
    } else {
      cleanupOverlay();
    }

    return cleanupOverlay;
  }, [externalDropState.isDragOver, externalDropState.dropTarget]);

  // 전역 드래그 이벤트 방지
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

    return <div className={styles.collaborationStatus}></div>;
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
      <FileTreeContextMenu
        onNewFile={(parentNode?: FileTreeNode) => openCreateModal('FILE', parentNode)}
        onNewFolder={(parentNode?: FileTreeNode) => openCreateModal('FOLDER', parentNode)}
      >
        <div className={clsx(styles.fileTree, className)}>
          {renderCollaborationStatus()}
          <div className={styles.emptyState}>
            <span>파일이 없습니다.</span>
            <button
              onClick={() => openCreateModal('FILE')}
              className={styles.createFirstFileButton}
            >
              첫 번째 파일 만들기
            </button>
          </div>
        </div>
      </FileTreeContextMenu>
    );
  }

  // 외부 드래그 상태 확인 함수
  const isExternalDragActive = () => {
    return externalDropState.isDragOver;
  };

  // 트리 렌더링 함수 - 안전성 강화
  const renderTreeNodes = (nodes: FileTreeNode[], level = 0) => {
    // 유효한 노드들만 필터링
    const validNodes = filterValidNodes(nodes);

    if (validNodes.length === 0) {
      console.warn('renderTreeNodes: 유효한 노드가 없음', nodes);
      return null;
    }

    return validNodes.map(node => {
      // 노드 유효성 재검사
      if (!isValidNode(node)) {
        debugNode(node, 'renderTreeNodes - 유효하지 않은 노드');
        return null;
      }

      const nodeId = getNodeId(node);
      if (!nodeId) {
        debugNode(node, 'renderTreeNodes - nodeId 없음');
        return null;
      }

      // children을 미리 계산
      const childrenElements =
        node.children && node.children.length > 0 && expandedFolders.has(nodeId)
          ? renderTreeNodes(node.children as FileTreeNode[], level + 1)
          : null;

      return (
        <React.Fragment key={nodeId}>
          <FileTreeItem
            node={node}
            level={level}
            isExpanded={expandedFolders.has(nodeId)}
            isSelected={selectedFile === node.path}
            // 파일/폴더 액션
            onFileClick={handleFileClick}
            onFolderToggle={handleFolderToggle}
            // 컨텍스트 메뉴
            onNewFile={parentNode => openCreateModal('FILE', parentNode)}
            onNewFolder={parentNode => openCreateModal('FOLDER', parentNode)}
            onRename={() => startEditing(nodeId)}
            onDelete={deleteItem}
            // 인라인 편집
            isEditing={editingNode === nodeId}
            onEditSave={(node, newName) => renameItem(node, newName)}
            onEditCancel={stopEditing}
            // 내부 드래그앤드롭
            isDragging={isDragging(nodeId)}
            isDropTarget={isDropTarget(nodeId)}
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
            isExternalDragOver={externalDropState.dropTarget?.nodeId === nodeId}
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
      {/* 전체 영역을 FileTreeContextMenu로 래핑 */}
      <FileTreeContextMenu
        onNewFile={(parentNode?: FileTreeNode) => openCreateModal('FILE', parentNode)}
        onNewFolder={(parentNode?: FileTreeNode) => openCreateModal('FOLDER', parentNode)}
      >
        <div
          className={clsx(styles.fileTree, className, {
            [styles.collaborationMode]: enableCollaboration,
            [styles.rootDropTarget]: isRootDropTarget,
          })}
          data-file-tree-container
          onDragEnter={handleExternalDragEnter}
          onDragOver={e => {
            handleExternalDragOver(e);
            handleContainerDragOver(e);
          }}
          onDragLeave={handleExternalDragLeave}
          onDrop={e => {
            handleExternalDrop(e);
            handleContainerDrop(e);
          }}
        >
          {/* 협업 상태 표시 */}
          {renderCollaborationStatus()}

          {/* 파일 트리 내용 */}
          <div className={clsx(styles.treeContainer, styles.dropZone)}>
            {renderTreeNodes(treeData)}
          </div>

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

          {/* 최상위 폴더 드롭 피드백 */}
          {isRootDropTarget && (
            <div className={styles.rootDropOverlay}>
              <div className={styles.rootDropMessage}>
                <span className={styles.rootDropIcon}>📁</span>
                <span>최상위 폴더로 이동</span>
              </div>
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
