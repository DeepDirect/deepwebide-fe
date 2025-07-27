import React from 'react';
import clsx from 'clsx';
import FileTreeItem from './components/FileTreeItem/FileTreeItem';
import { useFileTree } from './hooks/useFileTree';
import { useFileTreeActions } from './hooks/useFileTreeActions';
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

  /**
   * 트리 노드들을 재귀적으로 렌더링
   */
  const renderTreeNodes = (nodes: FileTreeNode[]): React.ReactNode => {
    return nodes.map(node => {
      const isExpanded = expandedFolders.has(node.id);
      const isSelected = selectedFile === node.path;

      return (
        <React.Fragment key={node.id}>
          <FileTreeItem
            node={node}
            isExpanded={isExpanded}
            isSelected={isSelected}
            onFileClick={handleFileClick}
            onFolderToggle={handleFolderToggle}
          />

          {/* 폴더가 확장되어 있고 자식이 있으면 재귀 렌더링 */}
          {node.type === 'folder' && isExpanded && node.children && node.children.length > 0 && (
            <div className={styles.children}>{renderTreeNodes(node.children)}</div>
          )}
        </React.Fragment>
      );
    });
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
        </div>
      </div>
    );
  }

  // 데이터가 없는 경우
  if (!apiData?.data || apiData.status !== 200 || treeData.length === 0) {
    return (
      <div className={clsx(styles.fileTree, className)}>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📁</div>
          <span className={styles.emptyText}>파일이 없습니다</span>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx(styles.fileTree, className)}>
      <div className={styles.treeContainer}>{renderTreeNodes(treeData)}</div>
    </div>
  );
};

export default FileTree;
