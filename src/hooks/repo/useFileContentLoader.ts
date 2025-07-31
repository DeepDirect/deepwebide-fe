import { useEffect } from 'react';
import { useTabStore } from '@/stores/tabStore';
import { useFileContent } from './useFileContent';

interface UseFileContentLoaderParams {
  repositoryId: number;
  repoId: string;
  enabled?: boolean; // 하이드레이션 완료 후에만 동작하도록
}

// 현재 활성 탭의 파일 내용을 자동으로 로드하는 훅
export const useFileContentLoader = ({
  repositoryId,
  repoId,
  enabled = true,
}: UseFileContentLoaderParams) => {
  const { openTabs, setTabContent } = useTabStore();

  // 현재 활성 탭 찾기
  const activeTab = openTabs.find(tab => tab.isActive);

  // 활성 탭이 있고, 내용이 비어있으며, 해당 레포의 탭인 경우에만 파일 내용 로드
  const shouldLoadContent =
    enabled && activeTab && activeTab.content === '' && activeTab.id.startsWith(`${repoId}/`);

  const {
    data: fileContentData,
    isLoading,
    error,
  } = useFileContent({
    repositoryId,
    fileId: activeTab?.fileId || 0,
    enabled: shouldLoadContent && !!activeTab?.fileId,
  });

  // 탭 전환 디버깅 로그
  useEffect(() => {
    if (activeTab) {
      console.log(`활성 탭:`, {
        tabId: activeTab.id,
        path: activeTab.path,
        contentLength: activeTab.content?.length || 0,
        isEmpty: activeTab.content === '',
        shouldLoadContent,
      });
    }
  }, [activeTab?.id, shouldLoadContent]);

  // 파일 내용이 로드되면 탭에 설정
  useEffect(() => {
    if (fileContentData?.data?.content !== undefined && activeTab && shouldLoadContent) {
      const tabId = activeTab.id;
      const content = fileContentData.data.content;

      console.log(`파일 내용 설정:`, {
        tabId,
        filePath: activeTab.path,
        contentLength: content.length,
        contentPreview: content.substring(0, 50) + '...',
      });

      setTabContent(tabId, content);
    }
  }, [fileContentData, activeTab?.id, shouldLoadContent, setTabContent]);

  // 에러 처리
  useEffect(() => {
    if (error && activeTab && shouldLoadContent) {
      console.error(`파일 내용 로드 실패: ${activeTab.path}`, error);

      // 에러 발생 시 에러 메시지를 내용으로 설정
      const errorMessage = `// 파일을 불러올 수 없습니다.
// 경로: ${activeTab.path}
// 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}

// 파일이 존재하지 않거나 접근 권한이 없을 수 있습니다.`;

      setTabContent(activeTab.id, errorMessage);
    }
  }, [error, activeTab?.id, shouldLoadContent, setTabContent]);

  return {
    isLoading: shouldLoadContent ? isLoading : false,
    error: shouldLoadContent ? error : null,
  };
};
