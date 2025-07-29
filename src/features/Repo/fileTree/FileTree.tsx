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
import type { ApiFileTreeResponse, FileTreeNode } from './types';

interface FileTreeProps {
  repoId: string;
  apiData?: ApiFileTreeResponse | null;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

const FileTree: React.FC<FileTreeProps> = ({
  repoId,
  apiData,
  isLoading = false,
  error = null,
  className = '',
}) => {
  const { treeData, expandedFolders, setExpandedFolders, selectedFile, setSelectedFile } =
    useFileTree({
      apiData,
      isLoading,
      error,
    });

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
  } = useFileTreeOperations({
    repoId,
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
        repoId,
      });

      // TODO: 실제 파일 업로드 API 호출
      // const formData = new FormData();
      // files.forEach(file => formData.append('files', file));
      // formData.append('targetPath', targetPath);
      //
      // const response = await apiClient.post(`/api/repos/${repoId}/files/upload`, formData, {
      //   headers: { 'Content-Type': 'multipart/form-data' }
      // });

      // 임시 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000));

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

    // 전역 이벤트 리스너 등록
    document.addEventListener('dragover', preventGlobalDragOver);
    document.addEventListener('drop', preventGlobalDrop);

    return () => {
      document.removeEventListener('dragover', preventGlobalDragOver);
      document.removeEventListener('drop', preventGlobalDrop);
    };
  }, []);

  /**
   * 트리 노드들을 재귀적으로 렌더링
   */
  const renderTreeNodes = (nodes: FileTreeNode[]): React.ReactNode => {
    return nodes.map(node => {
      const isExpanded = expandedFolders.has(node.fileId.toString());
      const isSelected = selectedFile === node.path;
      const isEditing = editingNode?.fileId === node.fileId;
      const isNodeDragging = isDragging(node.fileId.toString());
      const isNodeDropTarget = isDropTarget(node.fileId.toString());
      const isNodeExternalDragOver = isExternalDragOver(node.fileId.toString());
      const canDropOnNode = dragDropState.draggedItem
        ? canDrop(dragDropState.draggedItem.node, node)
        : false;

      return (
        <React.Fragment key={node.fileId}>
          <FileTreeItem
            node={node}
            isExpanded={isExpanded}
            isSelected={isSelected}
            onFileClick={handleFileClick}
            onFolderToggle={handleFolderToggle}
            // 컨텍스트 메뉴 관련
            onNewFile={parent => openCreateModal('FILE', parent)}
            onNewFolder={parent => openCreateModal('FOLDER', parent)}
            onRename={startEditing}
            onDelete={deleteItem}
            onCopy={copyNode}
            onCut={cutNode}
            onPaste={pasteNode}
            canPaste={canPaste}
            // 인라인 편집 관련
            isEditing={isEditing}
            onEditSave={renameItem}
            onEditCancel={stopEditing}
            // 내부 드래그앤드롭 관련
            isDragging={isNodeDragging}
            isDropTarget={isNodeDropTarget}
            canDrop={canDropOnNode}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            getDropPosition={getDropPosition}
            // 외부 파일 드롭 관련
            isExternalDragOver={isNodeExternalDragOver}
            onExternalDragOver={handleNodeExternalDragOver}
            onExternalDragLeave={handleNodeExternalDragLeave}
            onExternalDrop={handleNodeExternalDrop}
          />

          {/* 폴더가 확장되어 있고 자식이 있으면 재귀 렌더링 */}
          {node.fileType === 'FOLDER' &&
            isExpanded &&
            node.children &&
            node.children.length > 0 && (
              <div className={styles.children}>
                {renderTreeNodes(node.children as FileTreeNode[])}
              </div>
            )}
        </React.Fragment>
      );
    });
  };

  // 통합된 드래그 이벤트 핸들러들
  const handleCombinedDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleExternalDragEnter(e);
  };

  const handleCombinedDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 항상 외부 드래그 오버 처리
    handleExternalDragOver(e);

    // 내부 드래그인 경우에만 move 이펙트 설정
    if (e.dataTransfer.types.includes('application/json')) {
      e.dataTransfer.dropEffect = 'move';
    } else {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleCombinedDragLeave = (e: React.DragEvent) => {
    // stopPropagation 제거하여 이벤트 전파 허용
    e.preventDefault();
    handleExternalDragLeave(e);
  };

  const handleCombinedDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('🎯 Drop detected:', {
      types: Array.from(e.dataTransfer.types),
      hasFiles: e.dataTransfer.types.includes('Files'),
      hasJson: e.dataTransfer.types.includes('application/json'),
      files: e.dataTransfer.files.length,
    });

    // 외부 파일 드롭이 우선
    if (
      e.dataTransfer.types.includes('Files') &&
      !e.dataTransfer.types.includes('application/json')
    ) {
      console.log('📁 External file drop to root');
      handleExternalDrop(e);
    } else if (e.dataTransfer.types.includes('application/json')) {
      // 내부 드래그인 경우 - 빈 공간에 드롭하는 경우 루트 레벨로 이동
      console.log('🔄 Internal drag to root');
      if (dragDropState.draggedItem) {
        const rootTargetNode: FileTreeNode = {
          fileId: 0,
          fileName: '',
          fileType: 'FOLDER',
          parentId: null,
          path: '',
          level: -1,
        };

        moveItem(dragDropState.draggedItem.node, rootTargetNode, 'inside').catch(error => {
          console.error('루트로 이동 실패:', error);
        });
      }

      handleDragEnd();
    }
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className={clsx(styles.fileTree, className)}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner} />
          <span className={styles.loadingText}>파일 트리 로딩 중...</span>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className={clsx(styles.fileTree, className)}>
        <div className={styles.error}>
          <div className={styles.errorIcon}>⚠️</div>
          <span className={styles.errorText}>{error}</span>
          <button className={styles.retryButton} onClick={() => window.location.reload()}>
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 데이터가 없는 경우
  if (!apiData?.data || apiData.status !== 200 || treeData.length === 0) {
    return (
      <FileTreeContextMenu
        onNewFile={() => openCreateModal('FILE')}
        onNewFolder={() => openCreateModal('FOLDER')}
        onPaste={() => pasteNode()}
        canPaste={canPaste}
      >
        <div
          className={clsx(styles.fileTree, className, {
            [styles.externalDragOver]: externalDropState.isDragOver,
          })}
          data-file-tree-container
          onDragEnter={handleCombinedDragEnter}
          onDragOver={handleCombinedDragOver}
          onDragLeave={handleCombinedDragLeave}
          onDrop={handleCombinedDrop}
        >
          <div className={clsx(styles.empty, styles.dropZone)}>
            <div className={styles.emptyIcon}>📁</div>
            <span className={styles.emptyText}>파일이 없습니다</span>
            <span className={styles.emptyHint}>
              우클릭으로 파일을 생성하거나 파일을 드래그해서 업로드하세요
            </span>
          </div>
        </div>
      </FileTreeContextMenu>
    );
  }

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
        </div>
      </FileTreeContextMenu>

      {/* 파일/폴더 생성 모달 */}
      <CreateFileModal
        open={createModalOpen}
        onOpenChange={closeCreateModal}
        type={createModalType}
        parentNode={createModalParent}
        onConfirm={createItem}
        onCancel={closeCreateModal}
      />
    </>
  );
};

export default FileTree;
