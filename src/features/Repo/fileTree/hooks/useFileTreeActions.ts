import { useCallback } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useTabStore } from '@/stores/tabStore';
import type { FileTreeNode } from '../types';

interface UseFileTreeActionsProps {
  repoId: string;
  setExpandedFolders: React.Dispatch<React.SetStateAction<Set<string>>>;
  setSelectedFile: React.Dispatch<React.SetStateAction<string | null>>;
}

export const useFileTreeActions = ({
  repoId,
  setExpandedFolders,
  setSelectedFile,
}: UseFileTreeActionsProps) => {
  const { openFileByPath } = useTabStore();
  const navigate = useNavigate();
  const params = useParams({ strict: false });

  /**
   * 파일 클릭 처리
   * - 탭 열기
   * - URL 업데이트
   * - 선택된 파일 상태 업데이트
   */
  const handleFileClick = useCallback(
    (node: FileTreeNode) => {
      if (node.fileType !== 'FILE') return;

      // 탭 열기
      openFileByPath(repoId, node.path);

      // URL 업데이트 - 현재 라우트로 이동하면서 search 파라미터만 업데이트
      navigate({
        to: '/$repoId',
        params: { repoId: params.repoId || repoId },
        search: { file: node.path },
        replace: false,
      });

      // 선택된 파일 상태 업데이트
      setSelectedFile(node.path);
    },
    [repoId, openFileByPath, navigate, params.repoId, setSelectedFile]
  );

  /**
   * 폴더 토글 처리
   * - 폴더 열림/닫힘 상태 관리
   */
  const handleFolderToggle = useCallback(
    (node: FileTreeNode) => {
      if (node.fileType !== 'FOLDER') return;

      setExpandedFolders(prev => {
        const newExpanded = new Set(prev);
        const nodeId = node.fileId.toString();

        if (newExpanded.has(nodeId)) {
          newExpanded.delete(nodeId);
        } else {
          newExpanded.add(nodeId);
        }

        return newExpanded;
      });
    },
    [setExpandedFolders]
  );

  /**
   * 특정 경로의 파일을 선택하고 필요한 폴더들을 확장
   */
  const selectFileByPath = useCallback(
    (filePath: string, treeData: FileTreeNode[]) => {
      // 파일 경로에 따라 필요한 폴더들을 자동으로 확장
      const foldersToExpand = new Set<string>();

      const findFoldersInPath = (nodes: FileTreeNode[], currentPath: string[] = []): void => {
        for (const node of nodes) {
          const nodePath = [...currentPath, node.fileName];
          const nodePathString = nodePath.join('/');

          if (node.fileType === 'FOLDER' && filePath.startsWith(nodePathString + '/')) {
            foldersToExpand.add(node.fileId.toString());

            if (node.children) {
              findFoldersInPath(node.children as FileTreeNode[], nodePath);
            }
          }
        }
      };

      findFoldersInPath(treeData);

      // 폴더들을 확장
      setExpandedFolders(prev => new Set([...prev, ...foldersToExpand]));

      // 파일 선택
      setSelectedFile(filePath);
    },
    [setExpandedFolders, setSelectedFile]
  );

  /**
   * 모든 폴더 접기
   */
  const collapseAllFolders = useCallback(() => {
    setExpandedFolders(new Set());
  }, [setExpandedFolders]);

  /**
   * 특정 레벨까지 폴더 확장
   */
  const expandToLevel = useCallback(
    (level: number, treeData: FileTreeNode[]) => {
      const foldersToExpand = new Set<string>();

      const collectFoldersAtLevel = (nodes: FileTreeNode[]): void => {
        for (const node of nodes) {
          if (node.fileType === 'FOLDER' && node.level <= level) {
            foldersToExpand.add(node.fileId.toString());

            if (node.children) {
              collectFoldersAtLevel(node.children as FileTreeNode[]);
            }
          }
        }
      };

      collectFoldersAtLevel(treeData);
      setExpandedFolders(foldersToExpand);
    },
    [setExpandedFolders]
  );

  return {
    handleFileClick,
    handleFolderToggle,
    selectFileByPath,
    collapseAllFolders,
    expandToLevel,
  };
};
