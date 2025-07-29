import { useState, useCallback } from 'react';
import type { FileTreeNode } from '../types';

interface ClipboardItem {
  node: FileTreeNode;
  operation: 'copy' | 'cut';
  timestamp: number;
}

interface UseFileTreeClipboardReturn {
  clipboardItem: ClipboardItem | null;
  canPaste: boolean;
  copyNode: (node: FileTreeNode) => void;
  cutNode: (node: FileTreeNode) => void;
  pasteNode: (targetNode?: FileTreeNode) => Promise<void>;
  clearClipboard: () => void;
}

export const useFileTreeClipboard = (
  onPaste: (
    sourceNode: FileTreeNode,
    targetPath: string,
    operation: 'copy' | 'cut'
  ) => Promise<void>
): UseFileTreeClipboardReturn => {
  const [clipboardItem, setClipboardItem] = useState<ClipboardItem | null>(null);

  const copyNode = useCallback((node: FileTreeNode) => {
    setClipboardItem({
      node,
      operation: 'copy',
      timestamp: Date.now(),
    });
    console.log(`📋 복사됨: ${node.fileName}`);
  }, []);

  const cutNode = useCallback((node: FileTreeNode) => {
    setClipboardItem({
      node,
      operation: 'cut',
      timestamp: Date.now(),
    });
    console.log(`✂️ 잘라내기: ${node.fileName}`);
  }, []);

  const pasteNode = useCallback(
    async (targetNode?: FileTreeNode) => {
      if (!clipboardItem) {
        console.warn('클립보드가 비어있습니다.');
        return;
      }

      // 타겟 경로 결정
      let targetPath = '';
      if (targetNode) {
        if (targetNode.fileType === 'FOLDER') {
          targetPath = targetNode.path;
        } else {
          // 파일의 경우 부모 폴더로
          const pathParts = targetNode.path.split('/');
          pathParts.pop();
          targetPath = pathParts.join('/');
        }
      }

      // 자기 자신에게 붙여넣기 방지
      if (clipboardItem.node.path === targetPath) {
        console.warn('같은 위치에는 붙여넣을 수 없습니다.');
        return;
      }

      // 하위 폴더로 이동 방지 (폴더를 자신의 하위 폴더로 이동하는 것 방지)
      if (
        clipboardItem.node.fileType === 'FOLDER' &&
        targetPath.startsWith(clipboardItem.node.path + '/')
      ) {
        console.warn('폴더를 자신의 하위 폴더로 이동할 수 없습니다.');
        return;
      }

      try {
        await onPaste(clipboardItem.node, targetPath, clipboardItem.operation);

        // 잘라내기의 경우 클립보드 클리어
        if (clipboardItem.operation === 'cut') {
          setClipboardItem(null);
        }

        console.log(`📁 붙여넣기 완료: ${clipboardItem.node.fileName} → ${targetPath || '루트'}`);
      } catch (error) {
        console.error('붙여넣기 실패:', error);
      }
    },
    [clipboardItem, onPaste]
  );

  const clearClipboard = useCallback(() => {
    setClipboardItem(null);
    console.log('🗑️ 클립보드 클리어');
  }, []);

  const canPaste = clipboardItem !== null;

  return {
    clipboardItem,
    canPaste,
    copyNode,
    cutNode,
    pasteNode,
    clearClipboard,
  };
};
