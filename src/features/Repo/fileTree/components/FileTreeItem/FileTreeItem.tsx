import React from 'react';
import clsx from 'clsx';
import { getFolderIcon, getFileIcon } from '@/utils/fileExtensions';
import { useTabStore } from '@/stores/tabStore';
import FileTreeContextMenu from '../FileTreeContextMenu/FileTreeContextMenu';
import InlineEdit from '../InlineEdit/InlineEdit';
import styles from './FileTreeItem.module.scss';
import type { FileTreeItemProps } from '../../types';

const FileTreeItem: React.FC<FileTreeItemProps> = ({
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
  // 인라인 편집
  isEditing = false,
  onEditSave,
  onEditCancel,
  // 내부 드래그앤드롭
  isDragging = false,
  isDropTarget = false,
  canDrop = true,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  getDropPosition,
  // 외부 파일 드롭
  isExternalDragOver = false,
  onExternalDragOver,
  onExternalDragLeave,
  onExternalDrop,
}) => {
  const { openTabs } = useTabStore();

  // 탭 상태 확인 - 파일만 체크
  const getTabStatus = () => {
    if (node.fileType === 'FOLDER') {
      return { isOpen: false, isActive: false, isDirty: false };
    }

    const tab = openTabs.find(
      tab =>
        tab.fileId === node.fileId || tab.path === node.path || tab.id.endsWith(`/${node.path}`)
    );

    return {
      isOpen: !!tab && !tab.isDeleted && !tab.hasFileTreeMismatch,
      isActive: !!tab && tab.isActive && !tab.isDeleted && !tab.hasFileTreeMismatch,
      isDirty: !!tab && tab.isDirty && !tab.isDeleted && !tab.hasFileTreeMismatch,
      tab,
    };
  };

  const tabStatus = getTabStatus();

  const handleClick = (e: React.MouseEvent) => {
    // 편집 중이거나 드래그 중일 때는 클릭 이벤트 무시
    if (isEditing || isDragging) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // 폴더 클릭 시 항상 토글 (확장 상태와 관계없이)
    if (node.fileType === 'FOLDER' && onFolderToggle) {
      onFolderToggle(node);
    } else if (node.fileType === 'FILE' && onFileClick) {
      onFileClick(node);
    }
  };

  const handleKeyboardInteraction = () => {
    // 편집 중이거나 드래그 중일 때는 키보드 이벤트 무시
    if (isEditing || isDragging) return;

    if (node.fileType === 'FOLDER' && onFolderToggle) {
      onFolderToggle(node);
    } else if (node.fileType === 'FILE' && onFileClick) {
      onFileClick(node);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 더블클릭으로 이름 편집 시작 (드래그 중이 아닐 때만)
    if (onRename && !isEditing && !isDragging) {
      onRename(node);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isEditing || isDragging) return;

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

  // 내부 드래그 시작 핸들러
  const handleDragStart = (e: React.DragEvent) => {
    if (isEditing) {
      e.preventDefault();
      return;
    }

    if (onDragStart) {
      onDragStart(node, e);
    }
  };

  // 내부 드래그 종료 핸들러
  const handleDragEnd = () => {
    if (onDragEnd) {
      onDragEnd();
    }
  };

  // 통합된 드래그 오버 핸들러 (내부 + 외부)
  const handleCombinedDragOver = (e: React.DragEvent) => {
    // 외부 파일 드래그인지 확인
    const isExternalFile =
      !e.dataTransfer.types.includes('application/json') && e.dataTransfer.types.includes('Files');

    if (isExternalFile) {
      // 외부 파일 드래그오버
      if (onExternalDragOver) {
        onExternalDragOver(node, e);
      }
    } else {
      // 내부 드래그오버
      e.preventDefault();
      if (onDragOver) {
        onDragOver(node, e);
      }
    }
  };

  // 통합된 드래그 리브 핸들러 (내부 + 외부)
  const handleCombinedDragLeave = (e: React.DragEvent) => {
    const isExternalFile =
      !e.dataTransfer.types.includes('application/json') && e.dataTransfer.types.includes('Files');

    if (isExternalFile) {
      // 외부 파일 드래그리브
      if (onExternalDragLeave) {
        onExternalDragLeave(node, e);
      }
    } else {
      // 내부 드래그리브 (preventDefault 필요)
      e.preventDefault();
      if (onDragLeave) {
        onDragLeave();
      }
    }
  };

  // 통합된 드롭 핸들러 (내부 + 외부)
  const handleCombinedDrop = (e: React.DragEvent) => {
    const isExternalFile =
      !e.dataTransfer.types.includes('application/json') && e.dataTransfer.types.includes('Files');

    if (isExternalFile) {
      // 외부 파일 드롭
      if (onExternalDrop) {
        onExternalDrop(node, e);
      }
    } else {
      // 내부 드롭 (preventDefault 필요)
      e.preventDefault();
      if (onDrop) {
        onDrop(node, e);
      }
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

  const icon = node.fileType === 'FOLDER' ? getFolderIcon(isExpanded) : getFileIcon(node.fileName);

  // 최상단 레벨 폴더인지 확인 (level이 0, 1이고 path에 '/'가 없는 경우)
  const isTopLevel = node.level <= 1;

  return (
    <FileTreeContextMenu
      node={node}
      onNewFile={onNewFile}
      onNewFolder={onNewFolder}
      onRename={onRename}
      onDelete={onDelete}
    >
      <div
        className={clsx(
          styles.fileTreeItem,
          {
            [styles.selected]: isSelected,
            [styles.folder]: node.fileType === 'FOLDER',
            [styles.file]: node.fileType === 'FILE',
            [styles.editing]: isEditing,
            [styles.dragging]: isDragging,
            [styles.dropTarget]: isDropTarget,
            [styles.canDrop]: canDrop && isDropTarget,
            [styles.cannotDrop]: !canDrop && isDropTarget,
            [styles.draggable]: !isEditing,
            // 탭 상태 클래스 - 미묘하게 적용
            [styles.hasTab]: tabStatus.isOpen,
            [styles.activeTab]: tabStatus.isActive,
            [styles.dirtyTab]: tabStatus.isDirty,
            // 내부 드롭 위치별 클래스
            [styles.dropBefore]:
              isDropTarget && getDropPosition?.(node.fileId.toString()) === 'before',
            [styles.dropInside]:
              isDropTarget && getDropPosition?.(node.fileId.toString()) === 'inside',
            [styles.dropAfter]:
              isDropTarget && getDropPosition?.(node.fileId.toString()) === 'after',
            // 외부 파일 드래그오버 클래스
            [styles.externalDragOver]: isExternalDragOver,
          },
          className
        )}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={isEditing ? -1 : 0}
        aria-expanded={node.fileType === 'FOLDER' ? isExpanded : undefined}
        style={{ paddingLeft: `${8 + node.level * 16}px` }}
        // 드래그앤드롭 이벤트
        draggable={!isEditing}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleCombinedDragOver}
        onDragLeave={handleCombinedDragLeave}
        onDrop={handleCombinedDrop}
        // 최상단 레벨 여부를 data attribute로 전달
        data-is-top-level={isTopLevel}
        title={
          tabStatus.isOpen
            ? `${node.fileName}${tabStatus.isActive ? ' (활성 탭)' : ' (열린 탭)'}${tabStatus.isDirty ? ' (변경됨)' : ''}`
            : node.fileName
        }
      >
        <div className={styles.arrowArea}>
          {node.fileType === 'FOLDER' && (
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

        <div className={styles.iconWrapper}>
          <img
            src={icon}
            alt={node.fileType === 'FOLDER' ? 'folder' : 'file'}
            className={styles.icon}
          />
        </div>

        <InlineEdit
          value={node.fileName}
          isEditing={isEditing}
          onSave={handleEditSave}
          onCancel={onEditCancel || (() => {})}
          className={styles.name}
          validateInput={validateFileName}
        />

        {/* 탭 상태 인디케이터 - 우측 끝에 고정 위치 */}
        {node.fileType === 'FILE' && (
          <div className={styles.tabStatusIndicators}>
            {tabStatus.isActive && <div className={styles.activeIndicator} title="현재 활성 탭" />}
            {tabStatus.isDirty && (
              <div className={styles.dirtyIndicator} title="변경된 내용이 있음" />
            )}
          </div>
        )}

        {/* 외부 파일 드래그오버 상태 표시 */}
        {isExternalDragOver && (
          <div className={styles.externalDropIndicator}>
            {node.fileType === 'FOLDER' ? (
              <span className={styles.folderDropText}>📁 폴더 안으로 업로드</span>
            ) : (
              <span className={styles.fileDropText}>📄 같은 레벨에 업로드</span>
            )}
          </div>
        )}
      </div>
    </FileTreeContextMenu>
  );
};

export default FileTreeItem;
