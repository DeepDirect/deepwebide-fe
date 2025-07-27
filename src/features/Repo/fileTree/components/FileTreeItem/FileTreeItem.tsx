import React from 'react';
import clsx from 'clsx';
import { getFolderIcon, getFileIcon } from '@/utils/fileExtensions';
import styles from './FileTreeItem.module.scss';
import type { FileTreeItemProps } from '../../types';

const FileTreeItem: React.FC<FileTreeItemProps> = ({
  node,
  isExpanded,
  isSelected,
  onFileClick,
  onFolderToggle,
  className = '',
}) => {
  const handleClick = () => {
    if (node.type === 'folder' && onFolderToggle) {
      onFolderToggle(node);
    } else if (node.type === 'file' && onFileClick) {
      onFileClick(node);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const icon = node.type === 'folder' ? getFolderIcon(isExpanded) : getFileIcon(node.name);

  return (
    <div
      className={clsx(
        styles.fileTreeItem,
        {
          [styles.selected]: isSelected,
          [styles.folder]: node.type === 'folder',
          [styles.file]: node.type === 'file',
        },
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-expanded={node.type === 'folder' ? isExpanded : undefined}
      style={{ paddingLeft: `${8 + node.level * 16}px` }}
    >
      {/* 화살표 영역 - 항상 동일한 크기 유지 */}
      <div className={styles.arrowArea}>
        {node.type === 'folder' && (
          <div
            className={clsx(styles.arrow, {
              [styles.expanded]: isExpanded,
            })}
          >
            <svg width="8" height="8" viewBox="0 0 16 16" className={styles.arrowIcon}>
              <path
                d="M6 4l4 4-4 4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>

      {/* 아이콘 */}
      <div className={styles.iconWrapper}>
        <img src={icon} alt={node.type === 'folder' ? 'folder' : 'file'} className={styles.icon} />
      </div>

      {/* 파일/폴더 이름 */}
      <span className={styles.name} title={node.name}>
        {node.name}
      </span>
    </div>
  );
};

export default FileTreeItem;
