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
  onCopy?: (node: FileTreeNode) => void;
  onCut?: (node: FileTreeNode) => void;
  onPaste?: (parentNode?: FileTreeNode) => void;
  canPaste?: boolean;
}

const FileTreeContextMenu: React.FC<FileTreeContextMenuProps> = ({
  node,
  children,
  onNewFile,
  onNewFolder,
  onRename,
  onDelete,
  onCopy,
  onCut,
  onPaste,
  canPaste = false,
}) => {
  const isFolder = node?.type === 'folder';

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

              <ContextMenu.Separator className={styles.separator} />
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

              <ContextMenu.Item className={styles.item} onClick={() => onCopy?.(node)}>
                <span className={styles.icon}>📋</span>
                복사
                <span className={styles.shortcut}>Ctrl+C</span>
              </ContextMenu.Item>

              <ContextMenu.Item className={styles.item} onClick={() => onCut?.(node)}>
                <span className={styles.icon}>✂️</span>
                잘라내기
                <span className={styles.shortcut}>Ctrl+X</span>
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

          {/* 붙여넣기 - 클립보드에 데이터가 있을 때만 */}
          {canPaste && (isFolder || !node) && (
            <>
              <ContextMenu.Separator className={styles.separator} />
              <ContextMenu.Item className={styles.item} onClick={() => onPaste?.(node)}>
                <span className={styles.icon}>📄</span>
                붙여넣기
                <span className={styles.shortcut}>Ctrl+V</span>
              </ContextMenu.Item>
            </>
          )}
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
};

export default FileTreeContextMenu;
