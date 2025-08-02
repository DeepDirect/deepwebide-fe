import { useEffect } from 'react';
import { useTabStore } from '@/stores/tabStore';
import { useFileContent } from './useFileContent';

interface UseFileContentLoaderParams {
  repositoryId: number;
  repoId: string;
  enabled?: boolean;
  enableCollaboration?: boolean;
}

export const useFileContentLoader = ({
  repositoryId,
  repoId,
  enabled = true,
  enableCollaboration = false,
}: UseFileContentLoaderParams) => {
  const { openTabs, setTabContentFromFile } = useTabStore();

  const activeTab = openTabs.find(tab => tab.isActive);

  console.log('FileContentLoader 상태:', {
    activeTabPath: activeTab?.path,
    enableCollaboration,
    tabContent: activeTab?.content?.length || 0,
    enabled,
    shouldLoad: enabled && !enableCollaboration && activeTab && activeTab.content === '',
  });

  // 로딩 조건:
  // 1. enabled가 true
  // 2. 협업 모드가 아님 (협업 모드에서는 파일트리에서 직접 로드)
  // 3. 활성 탭이 있음
  // 4. 탭 내용이 비어있음 (아직 로드되지 않음)
  // 5. 탭이 현재 레포의 것임
  const shouldLoadContent =
    enabled &&
    !enableCollaboration &&
    activeTab &&
    activeTab.content === '' &&
    activeTab.id.startsWith(`${repoId}/`) &&
    activeTab.fileId;

  const {
    data: fileContentData,
    isLoading,
    error,
    refetch,
  } = useFileContent({
    repositoryId,
    fileId: activeTab?.fileId || 0,
    enabled: Boolean(shouldLoadContent), // Boolean으로 변환하여 타입 에러 해결
  });

  // 파일 내용 로드 성공 시 탭에 설정
  useEffect(() => {
    if (fileContentData?.data?.content !== undefined && activeTab && shouldLoadContent) {
      const tabId = activeTab.id;
      const content = fileContentData.data.content;

      console.log('파일 내용 설정 (일반 모드):', {
        tabId,
        filePath: activeTab.path,
        fileName: activeTab.name,
        contentLength: content.length,
        fileId: activeTab.fileId,
      });

      // setTabContentFromFile 사용으로 clean 상태 보장
      setTabContentFromFile(tabId, content);
    }
  }, [fileContentData, activeTab, shouldLoadContent, setTabContentFromFile]);

  // 에러 처리
  useEffect(() => {
    if (error && activeTab && shouldLoadContent) {
      console.error('파일 내용 로드 에러:', {
        error,
        tabId: activeTab.id,
        filePath: activeTab.path,
        fileId: activeTab.fileId,
      });

      const errorMessage = `// 파일을 불러올 수 없습니다.
// 경로: ${activeTab.path}
// 파일 ID: ${activeTab.fileId}
// 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}

// 다음을 확인해주세요:
// 1. 네트워크 연결 상태
// 2. 파일 접근 권한
// 3. 파일이 삭제되지 않았는지 확인

// 문제가 지속되면 페이지를 새로고침해주세요.`;

      setTabContentFromFile(activeTab.id, errorMessage);
    }
  }, [error, activeTab, shouldLoadContent, setTabContentFromFile]);

  // 수동 새로고침 함수
  const refreshCurrentFile = () => {
    if (activeTab && shouldLoadContent) {
      console.log('파일 내용 수동 새로고침:', {
        tabId: activeTab.id,
        filePath: activeTab.path,
      });

      refetch();
    }
  };

  return {
    isLoading: shouldLoadContent ? isLoading : false,
    error: shouldLoadContent ? error : null,
    shouldLoadContent,
    refreshCurrentFile,
    activeTab,
  };
};
