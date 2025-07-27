import React from 'react';
import clsx from 'clsx';
import { getFolderIcon, getFileIcon } from '@/utils/fileExtensions';
import FileTreeContextMenu from '../FileTreeContextMenu/FileTreeContextMenu';
import InlineEdit from '../InlineEdit/InlineEdit';
import styles from './FileTreeItem.module.scss';
import type { FileTreeItemProps } from '../../types';

interface ExtendedFileTreeItemProps extends FileTreeItemProps {
  // 컨텍스트 메뉴 관련
  onNewFile?: (parentNode?: import('../../types').FileTreeNode) => void;
  onNewFolder?: (parentNode?: import('../../types').FileTreeNode) => void;
  onRename?: (node: import('../../types').FileTreeNode) => void;
  onDelete?: (node: import('../../types').FileTreeNode) => void;
  onCopy?: (node: import('../../types').FileTreeNode) => void;
  onCut?: (node: import('../../types').FileTreeNode) => void;
  onPaste?: (parentNode?: import('../../types').FileTreeNode) => void;
  canPaste?: boolean;

  // 인라인 편집 관련
  isEditing?: boolean;
  onEditSave?: (node: import('../../types').FileTreeNode, newName: string) => Promise<void>;
  onEditCancel?: () => void;
}

const FileTreeItem: React.FC<ExtendedFileTreeItemProps> = ({
  node,
  isExpanded,
  isSelected,
  onFileClick,
  onFolderToggle,
  className = '',
  // 컨텍스트 메뉴
  onNewFile,
  onNewFolder,
  onRename,
  onDelete,
  onCopy,
  onCut,
  onPaste,
  canPaste = false,
  // 인라인 편집
  isEditing = false,
  onEditSave,
  onEditCancel,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    // 편집 중일 때는 클릭 이벤트 무시
    if (isEditing) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // 폴더 클릭 시 항상 토글 (확장 상태와 관계없이)
    if (node.type === 'folder' && onFolderToggle) {
      onFolderToggle(node);
    } else if (node.type === 'file' && onFileClick) {
      onFileClick(node);
    }
  };

  const handleKeyboardInteraction = () => {
    // 편집 중일 때는 키보드 이벤트 무시
    if (isEditing) return;

    if (node.type === 'folder' && onFolderToggle) {
      onFolderToggle(node);
    } else if (node.type === 'file' && onFileClick) {
      onFileClick(node);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 더블클릭으로 이름 편집 시작
    if (onRename && !isEditing) {
      onRename(node);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isEditing) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleKeyboardInteraction();
    } else if (e.key === 'F2') {
      e.preventDefault();
      onRename?.(node);
    } else if (e.key === 'Delete') {
      e.preventDefault();
      onDelete?.(node);
    }
  };

  const handleEditSave = async (newName: string) => {
    if (onEditSave) {
      await onEditSave(node, newName);
    }
  };

  const validateFileName = (name: string): string => {
    if (!name.trim()) {
      return '이름을 입력해주세요.';
    }

    // 파일시스템에서 금지된 문자들
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(name)) {
      return '파일명에는 < > : " / \\ | ? * 문자를 사용할 수 없습니다.';
    }

    // Windows 예약어 검사
    const reservedNames = [
      'CON',
      'PRN',
      'AUX',
      'NUL',
      'COM1',
      'COM2',
      'COM3',
      'COM4',
      'COM5',
      'COM6',
      'COM7',
      'COM8',
      'COM9',
      'LPT1',
      'LPT2',
      'LPT3',
      'LPT4',
      'LPT5',
      'LPT6',
      'LPT7',
      'LPT8',
      'LPT9',
    ];
    if (reservedNames.includes(name.toUpperCase().split('.')[0])) {
      return '이 이름은 시스템에서 예약된 이름입니다.';
    }

    return '';
  };

  const icon = node.type === 'folder' ? getFolderIcon(isExpanded) : getFileIcon(node.name);

  return (
    <FileTreeContextMenu
      node={node}
      onNewFile={onNewFile}
      onNewFolder={onNewFolder}
      onRename={onRename}
      onDelete={onDelete}
      onCopy={onCopy}
      onCut={onCut}
      onPaste={onPaste}
      canPaste={canPaste}
    >
      <div
        className={clsx(
          styles.fileTreeItem,
          {
            [styles.selected]: isSelected,
            [styles.folder]: node.type === 'folder',
            [styles.file]: node.type === 'file',
            [styles.editing]: isEditing,
          },
          className
        )}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={isEditing ? -1 : 0}
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
          <img
            src={icon}
            alt={node.type === 'folder' ? 'folder' : 'file'}
            className={styles.icon}
          />
        </div>

        {/* 파일/폴더 이름 - 인라인 편집 지원 */}
        <InlineEdit
          value={node.name}
          isEditing={isEditing}
          onSave={handleEditSave}
          onCancel={onEditCancel || (() => {})}
          className={styles.name}
          validateInput={validateFileName}
        />
      </div>
    </FileTreeContextMenu>
  );
};

export default FileTreeItem;
