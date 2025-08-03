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

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const continuousTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentTabIdRef = useRef<string | null>(null);
  const lastContentRef = useRef<string>('');

  const defaultInterval = collaborationMode ? 10000 : 5000;
  const saveInterval = continuousSaveInterval || defaultInterval;

  const tabStoreRef = useRef(useTabStore.getState());

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

  useEffect(() => {
    tabStoreRef.current = useTabStore.getState();
  });

  const saveFileMutation = useMutation({
    mutationFn: async ({ fileId, content }: { fileId: number; content: string }) => {
      return saveFileContent(repositoryId, fileId, content);
    },
    onSuccess: (_, variables) => {
      const { fileId, content } = variables;

      console.log('파일 저장 성공:', {
        fileId,
        contentLength: content.length,
        collaborationMode,
        timestamp: new Date().toISOString(),
      });

      setTimeout(() => {
        const { openTabs, setTabDirty } = tabStoreRef.current;
        const tab = openTabs.find(tab => tab.fileId === fileId);
        if (tab) {
          setTabDirty(tab.id, false);
        }
      }, 0);

      setLastSaved(new Date());
      lastContentRef.current = content;

      queryClient.invalidateQueries({
        queryKey: ['fileContent', repositoryId],
      });
    },
    onError: error => {
      console.error('파일 저장 실패:', error);
    },
  });

  const executeContinuousSave = useCallback(() => {
    const currentTabId = currentTabIdRef.current;
    if (!currentTabId) return;

    const { openTabs } = tabStoreRef.current;
    const currentTab = openTabs.find(tab => tab.id === currentTabId && tab.isActive);
    if (!currentTab || !currentTab.isDirty || !currentTab.fileId) return;

    const currentContent = currentTab.content || '';

    if (!currentContent || currentContent.trim() === '') {
      console.log('지속적 저장 건너뜀 - 빈 내용:', {
        tabId: currentTabId,
        contentLength: currentContent.length,
      });
      return;
    }

    if (currentContent !== lastContentRef.current) {
      console.log('지속적 저장 실행:', {
        tabId: currentTabId,
        fileId: currentTab.fileId,
        contentLength: currentContent.length,
        collaborationMode,
        lastContentLength: lastContentRef.current.length,
      });

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

  const enableContinuousSave = useCallback(
    (tabId: string) => {
      if (continuousTimerRef.current) {
        clearInterval(continuousTimerRef.current);
      }

      currentTabIdRef.current = tabId;

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

      continuousTimerRef.current = setInterval(executeContinuousSave, saveInterval);
    },
    [saveInterval, executeContinuousSave, collaborationMode]
  );

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

  const autoSaveFile = useCallback(
    (tabId: string, content: string) => {
      if (!enabled) return;

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }

      if (!content || content.trim() === '') {
        console.log('자동 저장 건너뜀 - 빈 내용:', {
          tabId,
          contentLength: content.length,
        });
        return;
      }

      const saveDelay = collaborationMode ? 3000 : 1500;

      console.log('자동 저장 예약:', {
        tabId,
        contentLength: content.length,
        delay: saveDelay,
        collaborationMode,
      });

      saveTimeoutRef.current = setTimeout(() => {
        const { openTabs } = tabStoreRef.current;
        const currentTab = openTabs.find(tab => tab.id === tabId);

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
