import { useCallback, useRef, useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveFileContent } from '@/api/fileContent';
import { useTabStore } from '@/stores/tabStore';

interface UseFileSaveProps {
  repositoryId: number;
  enabled?: boolean;
  collaborationMode?: boolean;
  continuousSaveInterval?: number;
}

export const useFileSave = ({
  repositoryId,
  enabled = true,
  collaborationMode = false,
  continuousSaveInterval = 5000,
}: UseFileSaveProps) => {
  const queryClient = useQueryClient();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 지속적 저장을 위한 상태
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const continuousTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentTabIdRef = useRef<string | null>(null);
  const lastContentRef = useRef<string>('');

  // TabStore를 ref로 안정화
  const tabStoreRef = useRef(useTabStore.getState());

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

  // TabStore 상태 업데이트
  useEffect(() => {
    tabStoreRef.current = useTabStore.getState();
  });

  // 파일 저장 뮤테이션
  const saveFileMutation = useMutation({
    mutationFn: async ({ fileId, content }: { fileId: number; content: string }) => {
      return saveFileContent(repositoryId, fileId, content);
    },
    onSuccess: (data, variables) => {
      const { fileId, content } = variables;

      // 상태 변경을 비동기로 처리하여 무한루프 방지
      setTimeout(() => {
        const { openTabs, setTabDirty } = tabStoreRef.current;
        const tab = openTabs.find(tab => tab.fileId === fileId);
        if (tab) {
          setTabDirty(tab.id, false);
        }
      }, 0);

      // 지속적 저장 상태 업데이트
      setLastSaved(new Date());
      lastContentRef.current = content;

      // 파일 내용 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ['fileContent', repositoryId],
      });
    },
  });

  // 지속적 저장 실행 함수
  const executeContinuousSave = useCallback(() => {
    const currentTabId = currentTabIdRef.current;
    if (!currentTabId) return;

    const { openTabs } = tabStoreRef.current;
    const currentTab = openTabs.find(tab => tab.id === currentTabId && tab.isActive);
    if (!currentTab || !currentTab.isDirty) return;

    const currentContent = currentTab.content || '';

    // 내용이 변경되었는지 확인
    if (currentContent !== lastContentRef.current && currentTab.fileId) {
      // 직접 API 호출 (무한루프 방지)
      saveFileContent(repositoryId, currentTab.fileId, currentContent).then(() => {
        setLastSaved(new Date());
        lastContentRef.current = currentContent;
        setTimeout(() => {
          const { setTabDirty } = tabStoreRef.current;
          setTabDirty(currentTab.id, false);
        }, 0);
      });
    }
  }, [repositoryId]);

  // 지속적 저장 활성화
  const enableContinuousSave = useCallback(
    (tabId: string) => {
      // 기존 타이머 정리
      if (continuousTimerRef.current) {
        clearInterval(continuousTimerRef.current);
      }

      currentTabIdRef.current = tabId;

      // 현재 내용 초기화
      const { openTabs } = tabStoreRef.current;
      const currentTab = openTabs.find(tab => tab.id === tabId);
      if (currentTab) {
        lastContentRef.current = currentTab.content || '';
      }

      // 지속적 저장 타이머 시작
      continuousTimerRef.current = setInterval(executeContinuousSave, continuousSaveInterval);
    },
    [continuousSaveInterval, executeContinuousSave]
  );

  // 지속적 저장 비활성화
  const disableContinuousSave = useCallback(() => {
    if (continuousTimerRef.current) {
      clearInterval(continuousTimerRef.current);
      continuousTimerRef.current = null;
    }

    currentTabIdRef.current = null;
    lastContentRef.current = '';
  }, []);

  // 즉시 저장 (Ctrl+S)
  const saveCurrentFile = useCallback(() => {
    if (!enabled) return;

    const { openTabs } = tabStoreRef.current;
    const activeTab = openTabs.find(tab => tab.isActive);
    if (!activeTab || !activeTab.fileId) return;

    if (activeTab.isDirty) {
      saveFileMutation.mutate({
        fileId: activeTab.fileId,
        content: activeTab.content || '',
      });
    }
  }, [enabled, saveFileMutation]);

  // 자동 저장 - 타이머 중복 방지
  const autoSaveFile = useCallback(
    (tabId: string, content: string) => {
      if (!enabled) return;

      // 기존 타이머 반드시 클리어
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }

      const saveDelay = collaborationMode ? 5000 : 2000;

      saveTimeoutRef.current = setTimeout(() => {
        const { openTabs } = tabStoreRef.current;
        const tab = openTabs.find(t => t.id === tabId);
        if (!tab || !tab.isDirty || !tab.fileId) return;

        saveFileMutation.mutate({
          fileId: tab.fileId,
          content,
        });
      }, saveDelay);
    },
    [enabled, saveFileMutation, collaborationMode]
  );

  return {
    saveCurrentFile,
    autoSaveFile,
    isSaving: saveFileMutation.isPending,
    lastSaved,
    enableContinuousSave,
    disableContinuousSave,
    executeContinuousSave,
  };
};
