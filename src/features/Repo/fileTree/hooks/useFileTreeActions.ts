import { useCallback } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useTabStore } from '@/stores/tabStore';
import { apiClient } from '@/api/client';
import type { FileTreeNode } from '../types';

interface UseFileTreeActionsProps {
  repoId: string;
  repositoryId?: number;
  setExpandedFolders: React.Dispatch<React.SetStateAction<Set<string>>>;
  setSelectedFile: React.Dispatch<React.SetStateAction<string | null>>;
}

export const useFileTreeActions = ({
  repoId,
  repositoryId, // repositoryId 받기
  setExpandedFolders,
  setSelectedFile,
}: UseFileTreeActionsProps) => {
  const { openFileByPath, setTabContent } = useTabStore(); // 사용하지 않는 변수 제거
  const navigate = useNavigate();
  const params = useParams({ strict: false });

  /**
   * 파일 클릭 처리
   * - 탭 열기
   * - URL 업데이트
   * - 선택된 파일 상태 업데이트
   */
  const handleFileClick = useCallback(
    async (node: FileTreeNode) => {
      if (node.fileType !== 'FILE') return;

      // 탭 열기
      openFileByPath(repoId, node.path);

      // API 연동 추가: 파일 내용 로드
      if (repositoryId) {
        try {
          console.log(`파일 내용 로드: ${node.path}`, {
            fileId: node.fileId,
            fileName: node.fileName,
            repositoryId,
          });

          console.log(
            `시도: fileId 사용 - /api/repositories/${repositoryId}/files/${node.fileId}/content`
          );
          const response = await apiClient.get<{
            status: number;
            data: {
              content: string;
            } | null;
          }>(`/api/repositories/${repositoryId}/files/${node.fileId}/content`);

          if (response.data?.status === 200 && response.data?.data?.content !== undefined) {
            const tabId = `${repoId}/${node.path}`;
            const content = response.data.data.content;

            console.log(`파일 내용 로드 완료: ${node.fileName}`, {
              contentLength: content.length,
              contentPreview: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
              tabId,
              isEmpty: content === '',
              responseData: response.data.data,
            });

            setTabContent(tabId, content);
          } else {
            console.warn('응답 구조가 예상과 다름:', {
              status: response.data?.status,
              hasData: !!response.data?.data,
              hasContent: !!response.data?.data?.content,
              fullResponse: response.data,
            });
          }
        } catch (error) {
          console.error(`파일 내용 로드 실패:`, error);

          const tabId = `${repoId}/${node.path}`;
          const errorMessage = `// 파일을 불러올 수 없습니다.
// 경로: ${node.path}
// 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`;
          setTabContent(tabId, errorMessage);
        }
      }

      navigate({
        to: '/$repoId',
        params: { repoId: params.repoId || repoId },
        search: { file: node.path },
        replace: false,
      });

      setSelectedFile(node.path);
    },
    [repoId, repositoryId, openFileByPath, setTabContent, navigate, params.repoId, setSelectedFile]
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

      if (foldersToExpand.size > 0) {
        setExpandedFolders(prev => new Set([...prev, ...foldersToExpand]));
      }

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
