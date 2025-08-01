import { useEffect, useState } from 'react';
import { useTabStore } from '@/stores/tabStore';
import { useFileContent } from './useFileContent';

interface UseFileContentLoaderParams {
  repositoryId: number;
  repoId: string;
  enabled?: boolean; // 하이드레이션 완료 후에만 동작하도록
  enableCollaboration?: boolean; // 협업 모드 여부 추가
}

// 협업 모드에서는 첫 사용자일 때만 API 로딩 수행
export const useFileContentLoader = ({
  repositoryId,
  repoId,
  enabled = true,
  enableCollaboration = false,
}: UseFileContentLoaderParams) => {
  const { openTabs, setTabContent } = useTabStore();
  const [yjsServerStatus, setYjsServerStatus] = useState<Map<string, boolean>>(new Map());

  // 현재 활성 탭 찾기
  const activeTab = openTabs.find(tab => tab.isActive);

  // Yjs 서버 상태 확인 (협업 모드일 때만)
  useEffect(() => {
    if (!enableCollaboration || !activeTab) return;

    const roomId = `repo-${repoId}-${activeTab.path}`;

    // 이미 확인한 룸이면 스킵
    if (yjsServerStatus.has(roomId)) return;

    const checkYjsServer = async (): Promise<void> => {
      try {
        // 간단한 WebSocket 연결 테스트
        const wsUrl = import.meta.env.VITE_YJS_WEBSOCKET_URL || 'ws://localhost:1234';
        const testWs = new WebSocket(`${wsUrl}/${roomId}`);

        let resolved = false;

        const cleanup = (): void => {
          if (!resolved) {
            resolved = true;
            try {
              testWs.close();
            } catch {
              // 이미 닫힌 경우 무시
            }
          }
        };

        testWs.onopen = () => {
          cleanup();
          setYjsServerStatus(prev => new Map(prev).set(roomId, true));
          console.log('Yjs 서버 활성 확인:', roomId);
        };

        testWs.onerror = () => {
          cleanup();
          setYjsServerStatus(prev => new Map(prev).set(roomId, false));
          console.log('Yjs 서버 비활성 확인:', roomId);
        };

        testWs.onclose = () => {
          cleanup();
          if (!yjsServerStatus.has(roomId)) {
            setYjsServerStatus(prev => new Map(prev).set(roomId, false));
            console.log('Yjs 서버 연결 종료:', roomId);
          }
        };

        // 2초 타임아웃
        setTimeout(() => {
          cleanup();
          if (!yjsServerStatus.has(roomId)) {
            setYjsServerStatus(prev => new Map(prev).set(roomId, false));
            console.log('Yjs 서버 상태 확인 타임아웃:', roomId);
          }
        }, 2000);
      } catch (error) {
        console.error('Yjs 서버 상태 확인 실패:', error);
        setYjsServerStatus(prev => new Map(prev).set(roomId, false));
      }
    };

    checkYjsServer();
  }, [enableCollaboration, activeTab?.path, repoId, yjsServerStatus]);

  // 실제 Yjs 서버 활성 상태 계산
  const isYjsServerActive =
    enableCollaboration && activeTab
      ? (yjsServerStatus.get(`repo-${repoId}-${activeTab.path}`) ?? false)
      : false;

  // API 로딩 조건: "첫 사용자"일 때만 (Yjs 서버가 비활성일 때만) API 로딩
  const shouldLoadContent =
    enabled &&
    activeTab &&
    activeTab.content === '' &&
    activeTab.id.startsWith(`${repoId}/`) &&
    (!enableCollaboration || !isYjsServerActive);

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
        enableCollaboration,
        isYjsServerActive,
        shouldLoadContent,
      });
    }
  }, [activeTab?.id, shouldLoadContent, enableCollaboration, isYjsServerActive]);

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
        loadReason: enableCollaboration ? 'first-user-in-collaboration' : 'normal-load',
      });

      setTabContent(tabId, content);
    }
  }, [fileContentData, activeTab?.id, shouldLoadContent, setTabContent, enableCollaboration]);

  // 에러 처리
  useEffect(() => {
    if (error && activeTab && shouldLoadContent) {
      console.error(`파일 내용 로드 실패: ${activeTab.path}`, error);

      // 에러 발생 시 에러 메시지를 내용으로 설정
      const errorMessage = `// 파일을 불러올 수 없습니다.
// 경로: ${activeTab.path}
// 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}
// 협업 모드: ${enableCollaboration ? '활성' : '비활성'}

// 파일이 존재하지 않거나 접근 권한이 없을 수 있습니다.`;

      setTabContent(activeTab.id, errorMessage);
    }
  }, [error, activeTab?.id, shouldLoadContent, setTabContent, enableCollaboration]);

  return {
    isLoading: shouldLoadContent ? isLoading : false,
    error: shouldLoadContent ? error : null,
    shouldLoadContent,
    isYjsServerActive,
  };
};
