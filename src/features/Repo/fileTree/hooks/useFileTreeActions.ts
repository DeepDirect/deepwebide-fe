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
  enableCollaboration?: boolean;
}

export const useFileTreeActions = ({
  repoId,
  repositoryId,
  setExpandedFolders,
  setSelectedFile,
  enableCollaboration = false,
}: UseFileTreeActionsProps) => {
  const { openFileByPath, setTabContentFromFile } = useTabStore();
  const navigate = useNavigate();
  const params = useParams({ strict: false });

  const handleFileClick = useCallback(
    async (node: FileTreeNode) => {
      if (node.fileType !== 'FILE') return;

      console.log('파일 클릭:', {
        fileName: node.fileName,
        path: node.path,
        fileId: node.fileId,
        enableCollaboration,
        timestamp: new Date().toISOString(),
      });

      // 1. 먼저 탭 생성 (빈 내용으로)
      openFileByPath(repoId, node.path, node.fileName, node.fileId);
      const tabId = `${repoId}/${node.path}`;

      console.log(`탭 생성 완료:`, {
        tabId,
        fileName: node.fileName,
      });

      // 2. 즉시 URL 업데이트 (UI 반응성 향상)
      try {
        navigate({
          to: '/$repoId',
          params: { repoId: params.repoId || repoId },
          search: { file: node.path },
          replace: false,
        });
        console.log(`URL 업데이트 완료: ${node.path}`);
      } catch (error) {
        console.error('Navigation 실패:', error);
      }

      // 3. 선택된 파일 상태 즉시 업데이트
      setSelectedFile(node.path);
      console.log(`파일 선택 상태 업데이트: ${node.path}`);

      // 4. 파일 내용 로드 (협업/일반 모드 구분 없이 항상 API 호출)
      if (repositoryId && node.fileId) {
        try {
          console.log(`파일 내용 로드 시도: ${node.path}`, {
            fileId: node.fileId,
            fileName: node.fileName,
            repositoryId,
            mode: enableCollaboration ? 'collaboration' : 'normal',
            apiUrl: `/api/repositories/${repositoryId}/files/${node.fileId}/content`,
          });

          // API 호출 시작 시간 기록
          const loadStartTime = performance.now();

          const response = await apiClient.get<{
            status: number;
            message: string;
            data: {
              content: string;
            } | null;
          }>(`/api/repositories/${repositoryId}/files/${node.fileId}/content`);

          const loadEndTime = performance.now();
          const loadDuration = loadEndTime - loadStartTime;

          if (response.data?.status === 200 && response.data?.data !== null) {
            const content = response.data.data.content || '';

            console.log(`파일 내용 로드 완료: ${node.fileName}`, {
              contentLength: content.length,
              isEmpty: content === '',
              fileId: node.fileId,
              mode: enableCollaboration ? 'collaboration' : 'normal',
              loadDuration: `${loadDuration.toFixed(2)}ms`,
              timestamp: new Date().toISOString(),
            });

            // 5. 탭에 내용 설정 (파일에서 로드한 내용은 clean 상태)
            console.log(`setTabContentFromFile 호출 시작:`, {
              tabId,
              contentLength: content.length,
            });

            setTabContentFromFile(tabId, content);

            console.log(`setTabContentFromFile 호출 완료:`, {
              tabId,
              contentLength: content.length,
              timestamp: new Date().toISOString(),
            });

            // 6. 협업 모드에서는 이 내용이 Yjs 초기화에 사용됨
            // (useYjsCollaboration에서 탭 내용을 읽어서 초기화)
            if (enableCollaboration) {
              console.log(`협업 모드: Yjs 초기화에 사용될 내용 준비 완료`, {
                contentLength: content.length,
                tabId,
              });
            }
          } else {
            throw new Error(response.data?.message || '파일 내용을 가져올 수 없습니다');
          }
        } catch (error) {
          console.error(`파일 내용 로드 실패:`, {
            error,
            fileName: node.fileName,
            path: node.path,
            fileId: node.fileId,
            repositoryId,
          });

          // 에러 메시지를 탭에 표시
          const errorMessage = `// 파일을 불러올 수 없습니다.
// 경로: ${node.path}
// 파일 ID: ${node.fileId}
// 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}

// 네트워크 연결을 확인하거나 파일 권한을 확인해주세요.
// 문제가 지속되면 페이지를 새로고침해주세요.`;

          setTabContentFromFile(tabId, errorMessage);

          console.log(`에러 메시지 탭에 설정 완료:`, {
            tabId,
            errorMessageLength: errorMessage.length,
          });
        }
      } else {
        console.warn(`파일 로드 건너뜀:`, {
          repositoryId: !!repositoryId,
          fileId: !!node.fileId,
          reason: !repositoryId ? 'repositoryId 없음' : 'fileId 없음',
        });
      }

      console.log(`파일 클릭 처리 완료: ${node.fileName}`);
    },
    [
      repoId,
      repositoryId,
      openFileByPath,
      setTabContentFromFile,
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

  return {
    handleFileClick,
    handleFolderToggle,
    selectFileByPath,
  };
};
