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
  const { openTabs, setTabContent } = useTabStore();

  const activeTab = openTabs.find(tab => tab.isActive);

  console.log('FileContentLoader:', {
    activeTabPath: activeTab?.path,
    enableCollaboration,
    tabContent: activeTab?.content?.length || 0,
  });

  const shouldLoadContent =
    enabled &&
    !enableCollaboration &&
    activeTab &&
    activeTab.content === '' &&
    activeTab.id.startsWith(`${repoId}/`);

  const {
    data: fileContentData,
    isLoading,
    error,
  } = useFileContent({
    repositoryId,
    fileId: activeTab?.fileId || 0,
    enabled: shouldLoadContent && !!activeTab?.fileId,
  });

  useEffect(() => {
    if (fileContentData?.data?.content !== undefined && activeTab && shouldLoadContent) {
      const tabId = activeTab.id;
      const content = fileContentData.data.content;

      console.log('파일 내용 설정:', {
        tabId,
        filePath: activeTab.path,
        contentLength: content.length,
        enableCollaboration,
      });

      setTabContent(tabId, content);
    }
  }, [fileContentData, activeTab, shouldLoadContent, setTabContent, enableCollaboration]);

  useEffect(() => {
    if (error && activeTab && shouldLoadContent) {
      const errorMessage = `// 파일을 불러올 수 없습니다.
// 경로: ${activeTab.path}
// 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}

// 파일이 존재하지 않거나 접근 권한이 없을 수 있습니다.`;

      setTabContent(activeTab.id, errorMessage);
    }
  }, [error, activeTab, shouldLoadContent, setTabContent]);

  return {
    isLoading: shouldLoadContent ? isLoading : false,
    error: shouldLoadContent ? error : null,
    shouldLoadContent,
    isYjsServerActive: false,
  };
};
