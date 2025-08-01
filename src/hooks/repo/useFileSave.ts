import { useCallback, useRef, useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveFileContent } from '@/api/fileContent';
import { useTabStore } from '@/stores/tabStore';

interface UseFileSaveProps {
  repositoryId: number;
  enabled?: boolean;
  collaborationMode?: boolean; // 협업 모드 여부
  continuousSaveInterval?: number; // 지속적 저장 간격 추가
}

export const useFileSave = ({
  repositoryId,
  enabled = true,
  collaborationMode = false,
  continuousSaveInterval = 5000, // 기본 5초
}: UseFileSaveProps) => {
  const { openTabs, setTabDirty } = useTabStore();
  const queryClient = useQueryClient();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 지속적 저장을 위한 상태
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const continuousTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentTabIdRef = useRef<string | null>(null);
  const lastContentRef = useRef<string>('');

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      if (continuousTimerRef.current) {
        clearInterval(continuousTimerRef.current);
        continuousTimerRef.current = null;
      }
    };
  }, []);

  // 파일 저장 뮤테이션
  const saveFileMutation = useMutation({
    mutationFn: async ({ fileId, content }: { fileId: number; content: string }) => {
      console.log(`저장 API 호출:`, {
        fileId,
        contentLength: content.length,
        collaborationMode,
        timestamp: new Date().toISOString(),
      });
      return saveFileContent(repositoryId, fileId, content);
    },
    onSuccess: (data, variables) => {
      const { fileId, content } = variables;
      console.log(`저장 성공:`, {
        fileId,
        fileName: data.data.fileName,
        collaborationMode,
        contentLength: content.length,
      });

      // 해당 탭을 저장된 상태로 마크
      const tab = openTabs.find(tab => tab.fileId === fileId);

      if (tab) {
        setTabDirty(tab.id, false);
        console.log(`탭 저장 상태 업데이트: ${tab.name} → clean (협업 모드: ${collaborationMode})`);
      } else {
        console.warn(`저장된 파일의 탭을 찾을 수 없음: fileId=${fileId}`);
      }

      // 지속적 저장 상태 업데이트
      setLastSaved(new Date());
      lastContentRef.current = content;

      // 파일 내용 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ['fileContent', repositoryId],
      });
    },
    onError: (error, variables) => {
      const { fileId } = variables;
      console.error(`저장 실패:`, {
        fileId,
        error,
        collaborationMode,
      });

      const tab = openTabs.find(tab => tab.fileId === fileId);

      if (tab) {
        console.error(`파일 저장 실패: ${tab.name}`, error);
      }
    },
  });

  // 지속적 저장 실행 함수
  const executeContinuousSave = useCallback(() => {
    const currentTabId = currentTabIdRef.current;
    if (!currentTabId) return;

    const currentTab = openTabs.find(tab => tab.id === currentTabId && tab.isActive);
    if (!currentTab || !currentTab.isDirty) return;

    const currentContent = currentTab.content || '';

    // 내용이 변경되었는지 확인
    if (currentContent !== lastContentRef.current) {
      console.log('지속적 저장 실행:', {
        tabId: currentTabId,
        fileName: currentTab.name,
        contentLength: currentContent.length,
        interval: continuousSaveInterval,
      });

      if (currentTab.fileId) {
        saveFileMutation.mutate({
          fileId: currentTab.fileId,
          content: currentContent,
        });
      }
    }
  }, [openTabs, continuousSaveInterval, saveFileMutation]);

  // 지속적 저장 활성화
  const enableContinuousSave = useCallback(
    (tabId: string) => {
      console.log('지속적 저장 활성화:', { tabId, interval: continuousSaveInterval });

      // 기존 타이머 정리
      if (continuousTimerRef.current) {
        clearInterval(continuousTimerRef.current);
      }

      currentTabIdRef.current = tabId;

      // 현재 내용 초기화
      const currentTab = openTabs.find(tab => tab.id === tabId);
      if (currentTab) {
        lastContentRef.current = currentTab.content || '';
      }

      // 지속적 저장 타이머 시작
      continuousTimerRef.current = setInterval(executeContinuousSave, continuousSaveInterval);
    },
    [continuousSaveInterval, openTabs, executeContinuousSave]
  );

  // 지속적 저장 비활성화
  const disableContinuousSave = useCallback(() => {
    console.log('지속적 저장 비활성화');

    if (continuousTimerRef.current) {
      clearInterval(continuousTimerRef.current);
      continuousTimerRef.current = null;
    }

    currentTabIdRef.current = null;
    lastContentRef.current = '';
  }, []);

  // 즉시 저장 (Ctrl+S)
  const saveCurrentFile = useCallback(() => {
    console.log('saveCurrentFile 호출됨', {
      enabled,
      repositoryId,
      collaborationMode,
    });

    if (!enabled) {
      console.log('저장 비활성화됨');
      return;
    }

    const activeTab = openTabs.find(tab => tab.isActive);
    if (!activeTab) {
      console.log('활성 탭 없음');
      return;
    }

    console.log('활성 탭:', {
      id: activeTab.id,
      name: activeTab.name,
      isDirty: activeTab.isDirty,
      contentLength: activeTab.content?.length || 0,
      fileId: activeTab.fileId,
    });

    // fileId가 탭에 직접 저장되어 있는지 확인
    if (!activeTab.fileId) {
      console.error('탭에 fileId가 없음:', activeTab);
      return;
    }

    const fileId = activeTab.fileId;
    console.log('파일 저장 시도:', {
      fileId,
      isDirty: activeTab.isDirty,
      collaborationMode,
    });

    // 저장되지 않은 변경사항이 있는 경우에만 저장
    if (activeTab.isDirty) {
      saveFileMutation.mutate({
        fileId,
        content: activeTab.content || '',
      });
    } else {
      console.log('변경사항 없음 - 저장 생략');
    }
  }, [enabled, openTabs, saveFileMutation, repositoryId, collaborationMode]);

  // 자동 저장 (디바운스)
  const autoSaveFile = useCallback(
    (tabId: string, content: string) => {
      console.log('autoSaveFile 호출:', {
        tabId,
        enabled,
        contentLength: content.length,
        collaborationMode,
      });

      if (!enabled) {
        console.log('자동 저장 비활성화됨');
        return;
      }

      // 기존 타이머 클리어
      if (saveTimeoutRef.current) {
        console.log('기존 자동 저장 타이머 클리어');
        clearTimeout(saveTimeoutRef.current);
      }

      // 협업 모드에서는 저장 간격을 더 길게 설정 (5초 vs 2초)
      const saveDelay = collaborationMode ? 5000 : 2000;

      // 자동 저장 타이머 설정
      saveTimeoutRef.current = setTimeout(() => {
        console.log('자동 저장 타이머 실행:', {
          tabId,
          collaborationMode,
          delay: saveDelay,
        });

        const tab = openTabs.find(t => t.id === tabId);
        if (!tab) {
          console.log('탭을 찾을 수 없음:', tabId);
          return;
        }

        if (!tab.isDirty) {
          console.log('변경사항 없음 - 자동 저장 생략');
          return;
        }

        // fileId가 탭에 직접 저장되어 있는지 확인
        if (!tab.fileId) {
          console.error('탭에 fileId가 없음:', tab);
          return;
        }

        const fileId = tab.fileId;
        console.log(`자동 저장 실행: ${tab.name}`, {
          fileId,
          collaborationMode,
          delay: saveDelay,
        });
        saveFileMutation.mutate({ fileId, content });
      }, saveDelay);

      console.log(`자동 저장 타이머 설정됨 (${saveDelay}ms) - 협업 모드: ${collaborationMode}`);
    },
    [enabled, openTabs, saveFileMutation, collaborationMode]
  );

  return {
    saveCurrentFile,
    autoSaveFile,
    isSaving: saveFileMutation.isPending,
    lastSaved,
    // 지속적 저장 관련
    enableContinuousSave,
    disableContinuousSave,
    executeContinuousSave,
  };
};
