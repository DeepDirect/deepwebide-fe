import { useEffect, useRef } from 'react';
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

  // 중복 처리 방지를 위한 ref
  const processedTabsRef = useRef<Set<string>>(new Set());

  const activeTab = openTabs.find(tab => tab.isActive);

  console.log('FileContentLoader 상태:', {
    activeTabPath: activeTab?.path,
    enableCollaboration,
    tabContent: activeTab?.content?.length || 0,
    enabled,
    shouldLoad: enabled && !enableCollaboration && activeTab && activeTab.content === '',
  });

  // 로딩 조건 + 중복 처리 방지
  const shouldLoadContent =
    enabled &&
    !enableCollaboration &&
    activeTab &&
    activeTab.content === '' &&
    activeTab.id.startsWith(`${repoId}/`) &&
    activeTab.fileId &&
    !processedTabsRef.current.has(activeTab.id); // 중복 처리 방지 추가

  const {
    data: fileContentData,
    isLoading,
    error,
    refetch,
  } = useFileContent({
    repositoryId,
    fileId: activeTab?.fileId || 0,
    enabled: Boolean(shouldLoadContent),
  });

  // 파일 내용 로드 성공 시 탭에 설정
  useEffect(() => {
    if (fileContentData?.data?.content !== undefined && activeTab && shouldLoadContent) {
      const tabId = activeTab.id;
      const content = fileContentData.data.content;

      // 이미 처리한 탭인지 확인
      if (processedTabsRef.current.has(tabId)) {
        return;
      }

      console.log('파일 내용 설정 (일반 모드):', {
        tabId,
        filePath: activeTab.path,
        fileName: activeTab.name,
        contentLength: content.length,
        fileId: activeTab.fileId,
      });

      // 처리 완료 표시
      processedTabsRef.current.add(tabId);

      // setTabContentFromFile 사용으로 clean 상태 보장
      setTabContentFromFile(tabId, content);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    fileContentData?.data?.content,
    activeTab?.id,
    activeTab?.path,
    activeTab?.name,
    activeTab?.fileId,
    shouldLoadContent,
    setTabContentFromFile,
  ]);

  // 에러 처리
  useEffect(() => {
    if (error && activeTab && shouldLoadContent) {
      const tabId = activeTab.id;

      // 이미 처리한 탭인지 확인
      if (processedTabsRef.current.has(tabId)) {
        return;
      }

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

      // 처리 완료 표시
      processedTabsRef.current.add(tabId);
      setTabContentFromFile(activeTab.id, errorMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    error,
    activeTab?.id,
    activeTab?.path,
    activeTab?.fileId,
    shouldLoadContent,
    setTabContentFromFile,
  ]);

  // 탭이 변경되면 처리된 탭 목록 정리
  useEffect(() => {
    const currentTabIds = openTabs.map(tab => tab.id);
    const newProcessedTabs = new Set<string>();

    // 현재 열린 탭들만 유지
    currentTabIds.forEach(tabId => {
      if (processedTabsRef.current.has(tabId)) {
        newProcessedTabs.add(tabId);
      }
    });

    processedTabsRef.current = newProcessedTabs;
  }, [openTabs]);

  // 수동 새로고침 함수
  const refreshCurrentFile = () => {
    if (activeTab && shouldLoadContent) {
      console.log('파일 내용 수동 새로고침:', {
        tabId: activeTab.id,
        filePath: activeTab.path,
      });

      // 처리 기록 제거하여 다시 로드 가능하게 함
      processedTabsRef.current.delete(activeTab.id);
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
