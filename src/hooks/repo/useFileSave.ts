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
  continuousSaveInterval,
}: UseFileSaveProps) => {
  const queryClient = useQueryClient();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 지속적 저장을 위한 상태
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const continuousTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentTabIdRef = useRef<string | null>(null);
  const lastContentRef = useRef<string>('');

  // 협업 모드에 따른 저장 주기 설정
  const defaultInterval = collaborationMode ? 10000 : 5000; // 협업: 10초, 일반: 5초
  const saveInterval = continuousSaveInterval || defaultInterval;

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

      console.log('파일 저장 성공:', {
        fileId,
        contentLength: content.length,
        collaborationMode,
        timestamp: new Date().toISOString(),
      });

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
    onError: error => {
      console.error('파일 저장 실패:', error);
    },
  });

  // 지속적 저장 실행 함수
  const executeContinuousSave = useCallback(() => {
    const currentTabId = currentTabIdRef.current;
    if (!currentTabId) return;

    const { openTabs } = tabStoreRef.current;
    const currentTab = openTabs.find(tab => tab.id === currentTabId && tab.isActive);
    if (!currentTab || !currentTab.isDirty || !currentTab.fileId) return;

    const currentContent = currentTab.content || '';

    // 빈 내용은 저장하지 않음 (파일 내용 손실 방지)
    if (!currentContent || currentContent.trim() === '') {
      console.log('지속적 저장 건너뜀 - 빈 내용:', {
        tabId: currentTabId,
        contentLength: currentContent.length,
      });
      return;
    }

    // 내용이 변경되었는지 확인
    if (currentContent !== lastContentRef.current) {
      console.log('지속적 저장 실행:', {
        tabId: currentTabId,
        fileId: currentTab.fileId,
        contentLength: currentContent.length,
        collaborationMode,
        lastContentLength: lastContentRef.current.length,
      });

      // 직접 API 호출 (무한루프 방지)
      saveFileContent(repositoryId, currentTab.fileId, currentContent)
        .then(() => {
          setLastSaved(new Date());
          lastContentRef.current = currentContent;
          setTimeout(() => {
            const { setTabDirty } = tabStoreRef.current;
            setTabDirty(currentTab.id, false);
          }, 0);
        })
        .catch(error => {
          console.error('지속적 저장 실패:', error);
        });
    }
  }, [repositoryId, collaborationMode]);

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

      console.log('지속적 저장 활성화:', {
        tabId,
        interval: saveInterval,
        collaborationMode,
      });

      // 지속적 저장 타이머 시작
      continuousTimerRef.current = setInterval(executeContinuousSave, saveInterval);
    },
    [saveInterval, executeContinuousSave, collaborationMode]
  );

  // 지속적 저장 비활성화
  const disableContinuousSave = useCallback(() => {
    if (continuousTimerRef.current) {
      clearInterval(continuousTimerRef.current);
      continuousTimerRef.current = null;
    }

    console.log('지속적 저장 비활성화:', {
      tabId: currentTabIdRef.current,
      collaborationMode,
    });

    currentTabIdRef.current = null;
    lastContentRef.current = '';
  }, [collaborationMode]);

  // 즉시 저장 (Ctrl+S)
  const saveCurrentFile = useCallback(() => {
    if (!enabled) return;

    const { openTabs } = tabStoreRef.current;
    const activeTab = openTabs.find(tab => tab.isActive);
    if (!activeTab || !activeTab.fileId) return;

    console.log('즉시 저장 시도:', {
      tabId: activeTab.id,
      fileId: activeTab.fileId,
      isDirty: activeTab.isDirty,
      collaborationMode,
    });

    if (activeTab.isDirty) {
      saveFileMutation.mutate({
        fileId: activeTab.fileId,
        content: activeTab.content || '',
      });
    } else {
      console.log('저장할 변경사항 없음');
    }
  }, [enabled, saveFileMutation, collaborationMode]);

  // 자동 저장 - 빈 내용 저장 방지 추가
  const autoSaveFile = useCallback(
    (tabId: string, content: string) => {
      if (!enabled) return;

      // 기존 타이머 반드시 클리어
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }

      // 빈 내용은 저장하지 않음 (파일 내용 손실 방지)
      if (!content || content.trim() === '') {
        console.log('자동 저장 건너뜀 - 빈 내용:', {
          tabId,
          contentLength: content.length,
        });
        return;
      }

      // 협업 모드에서는 더 긴 지연 시간 (Yjs 동기화와 충돌 방지)
      const saveDelay = collaborationMode ? 3000 : 1500; // 협업: 3초, 일반: 1.5초

      console.log('자동 저장 예약:', {
        tabId,
        contentLength: content.length,
        delay: saveDelay,
        collaborationMode,
      });

      saveTimeoutRef.current = setTimeout(() => {
        const { openTabs } = tabStoreRef.current;
        const currentTab = openTabs.find(tab => tab.id === tabId);

        // 추가 검증: 탭 내용이 유효한지 확인
        if (
          currentTab?.isDirty &&
          currentTab.fileId &&
          currentTab.content &&
          currentTab.content.trim() !== ''
        ) {
          console.log('자동 저장 실행:', {
            tabId,
            fileId: currentTab.fileId,
            contentLength: content.length,
            collaborationMode,
          });

          saveFileMutation.mutate({
            fileId: currentTab.fileId,
            content,
          });
        } else {
          console.log('자동 저장 건너뜀 - 조건 불충족:', {
            tabId,
            isDirty: currentTab?.isDirty,
            hasFileId: !!currentTab?.fileId,
            hasContent: !!currentTab?.content,
            contentLength: currentTab?.content?.length || 0,
          });
        }

        saveTimeoutRef.current = null;
      }, saveDelay);
    },
    [enabled, collaborationMode, saveFileMutation]
  );

  return {
    saveCurrentFile,
    autoSaveFile,
    enableContinuousSave,
    disableContinuousSave,
    isSaving: saveFileMutation.isPending,
    lastSaved,
    saveInterval,
  };
};
