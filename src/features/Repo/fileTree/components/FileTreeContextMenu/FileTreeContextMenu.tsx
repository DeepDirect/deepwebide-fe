import React from 'react';
import { ContextMenu } from 'radix-ui';
import styles from './FileTreeContextMenu.module.scss';
import type { FileTreeNode } from '../../types';

interface FileTreeContextMenuProps {
  node?: FileTreeNode;
  children: React.ReactNode;
  onNewFile?: (parentNode?: FileTreeNode) => void;
  onNewFolder?: (parentNode?: FileTreeNode) => void;
  onRename?: (node: FileTreeNode) => void;
  onDelete?: (node: FileTreeNode) => void;
}

const FileTreeContextMenu: React.FC<FileTreeContextMenuProps> = ({
  node,
  children,
  onNewFile,
  onNewFolder,
  onRename,
  onDelete,
}) => {
  const isFolder = node?.fileType === 'FOLDER';

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        <div style={{ width: '100%', minHeight: '100%' }}>{children}</div>
      </ContextMenu.Trigger>

      <ContextMenu.Portal>
        <ContextMenu.Content
          className={styles.content}
          alignOffset={-4}
          avoidCollisions={true}
          collisionPadding={8}
        >
          {/* 새 파일/폴더 생성 - 폴더이거나 빈 공간일 때만 */}
          {(isFolder || !node) && (
            <>
              <ContextMenu.Item className={styles.item} onClick={() => onNewFile?.(node)}>
                <span className={styles.icon}>📄</span>새 파일
              </ContextMenu.Item>

              <ContextMenu.Item className={styles.item} onClick={() => onNewFolder?.(node)}>
                <span className={styles.icon}>📁</span>새 폴더
              </ContextMenu.Item>

              {/* 루트가 아닐 때만 구분선 표시 */}
              {node && <ContextMenu.Separator className={styles.separator} />}
            </>
          )}

          {/* 파일/폴더 작업 - 특정 노드가 선택되었을 때만 */}
          {node && (
            <>
              <ContextMenu.Item className={styles.item} onClick={() => onRename?.(node)}>
                <span className={styles.icon}>✏️</span>
                이름 바꾸기
                <span className={styles.shortcut}>F2</span>
              </ContextMenu.Item>

              <ContextMenu.Separator className={styles.separator} />

              <ContextMenu.Item
                className={`${styles.item} ${styles.danger}`}
                onClick={() => onDelete?.(node)}
              >
                <span className={styles.icon}>🗑️</span>
                삭제
                <span className={styles.shortcut}>Delete</span>
              </ContextMenu.Item>
            </>
          )}
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
};

export default FileTreeContextMenu;
