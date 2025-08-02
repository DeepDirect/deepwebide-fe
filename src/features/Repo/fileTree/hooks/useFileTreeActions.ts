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
  enableCollaboration?: boolean; // 협업 모드 여부 (선택적)
}

export const useFileTreeActions = ({
  repoId,
  repositoryId,
  setExpandedFolders,
  setSelectedFile,
  enableCollaboration = false, // 본값 false
}: UseFileTreeActionsProps) => {
  const { openFileByPath, setTabContent } = useTabStore();
  const navigate = useNavigate();
  const params = useParams({ strict: false });

  const handleFileClick = useCallback(
    async (node: FileTreeNode) => {
      if (node.fileType !== 'FILE') return;

      console.log('파일 클릭:', {
        fileName: node.fileName,
        path: node.path,
        fileId: node.fileId,
        enableCollaboration, // 로깅에 협업 모드 추가
      });

      // 협업 모드 여부에 관계없이 탭을 먼저 생성
      openFileByPath(repoId, node.path, node.fileName, node.fileId);

      if (repositoryId) {
        if (enableCollaboration) {
          // 에 빈 내용으로 설정하고 Yjs가 내용을 관리하도록 함
          console.log('협업 모드: 빈 탭 생성 후 Yjs 동기화 대기');

          const tabId = `${repoId}/${node.path}`;
          setTabContent(tabId, ''); // 빈 문자열로 초기화 (Yjs가 실제 내용으로 덮어씀)
        } else {
          // 일반 모드: 기존 로직 유지 (API에서 내용 로드)
          try {
            console.log(`파일 내용 로드 시도: ${node.path}`, {
              fileId: node.fileId,
              fileName: node.fileName,
              repositoryId,
            });

            const response = await apiClient.get<{
              status: number;
              message: string;
              data: {
                content: string;
              } | null;
            }>(`/api/repositories/${repositoryId}/files/${node.fileId}/content`);

            if (response.data?.status === 200 && response.data?.data !== null) {
              const tabId = `${repoId}/${node.path}`;
              const content = response.data.data.content || '';

              console.log(`파일 내용 로드 완료: ${node.fileName}`, {
                contentLength: content.length,
                isEmpty: content === '',
                fileId: node.fileId,
              });

              // 탭에 내용 설정 (clean 상태로)
              setTabContent(tabId, content);
            } else {
              throw new Error(response.data?.message || '파일 내용을 가져올 수 없습니다');
            }
          } catch (error) {
            console.error(`파일 내용 로드 실패:`, error);

            // 에러 메시지를 탭에 표시
            const tabId = `${repoId}/${node.path}`;
            const errorMessage = `// 파일을 불러올 수 없습니다.
// 경로: ${node.path}
// 파일 ID: ${node.fileId}
// 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}

// 파일이 존재하지 않거나 접근 권한이 없을 수 있습니다.`;

            setTabContent(tabId, errorMessage);
          }
        }
      }

      // URL 업데이트
      try {
        navigate({
          to: '/$repoId',
          params: { repoId: params.repoId || repoId },
          search: { file: node.path },
          replace: false,
        });
      } catch (error) {
        console.error('Navigation 실패:', error);
      }

      // 선택된 파일 상태 업데이트
      setSelectedFile(node.path);
    },
    [
      repoId,
      repositoryId,
      openFileByPath,
      setTabContent,
      navigate,
      params.repoId,
      setSelectedFile,
      enableCollaboration,
    ]
  );

  const handleFolderToggle = useCallback(
    (node: FileTreeNode) => {
      if (node.fileType !== 'FOLDER') return;

      console.log('폴더 토글:', {
        folderName: node.fileName,
        path: node.path,
        fileId: node.fileId,
      });

      setExpandedFolders(prev => {
        const newExpanded = new Set(prev);
        const nodeId = node.fileId.toString();

        if (newExpanded.has(nodeId)) {
          newExpanded.delete(nodeId);
          console.log(`폴더 닫기: ${node.fileName}`);
        } else {
          newExpanded.add(nodeId);
          console.log(`폴더 열기: ${node.fileName}`);
        }

        return newExpanded;
      });
    },
    [setExpandedFolders]
  );

  const selectFileByPath = useCallback(
    (filePath: string, treeData: FileTreeNode[]) => {
      console.log('경로로 파일 선택:', filePath);

      // 파일 경로에 따라 필요한 폴더들을 자동으로 확장
      const foldersToExpand = new Set<string>();

      const findFoldersInPath = (nodes: FileTreeNode[], currentPath: string[] = []): void => {
        for (const node of nodes) {
          const nodePath = [...currentPath, node.fileName];
          const nodePathString = nodePath.join('/');

          if (node.fileType === 'FOLDER' && filePath.startsWith(nodePathString + '/')) {
            foldersToExpand.add(node.fileId.toString());
            console.log(`경로 확장: ${node.fileName} (${nodePathString})`);

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

  const collapseAllFolders = useCallback(() => {
    console.log('모든 폴더 접기');
    setExpandedFolders(new Set());
  }, [setExpandedFolders]);

  const expandToLevel = useCallback(
    (level: number, treeData: FileTreeNode[]) => {
      console.log(`레벨 ${level}까지 폴더 확장`);

      const foldersToExpand = new Set<string>();

      const collectFoldersAtLevel = (nodes: FileTreeNode[]): void => {
        for (const node of nodes) {
          if (node.fileType === 'FOLDER' && node.level <= level) {
            foldersToExpand.add(node.fileId.toString());
            console.log(`레벨 확장: ${node.fileName} (레벨 ${node.level})`);

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
