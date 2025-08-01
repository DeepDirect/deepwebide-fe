import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useCollaborationStore } from '@/stores/collaborationStore';
import type { MonacoEditorInstance, Position, PixelPosition } from '@/types/repo/yjs.types';
import styles from './CursorOverlay.module.scss';

interface CursorOverlayProps {
  editorContainer: HTMLElement | null;
  monacoEditor?: MonacoEditorInstance | null;
  className?: string;
}

interface CursorPosition {
  x: number;
  y: number;
  userId: string;
  userName: string;
  userColor: string;
}

const CursorOverlay: React.FC<CursorOverlayProps> = ({
  editorContainer,
  monacoEditor,
  className,
}) => {
  const { users } = useCollaborationStore();
  const [cursors, setCursors] = useState<CursorPosition[]>([]);

  // 안전한 메서드 호출을 위한 헬퍼 함수
  const safelyCallMethod = useCallback(
    <T,>(obj: unknown, methodName: string, defaultValue: T, ...args: unknown[]): T => {
      try {
        if (obj && typeof obj === 'object' && methodName in obj) {
          const method = (obj as Record<string, unknown>)[methodName];
          if (typeof method === 'function') {
            return (method as (...args: unknown[]) => T).apply(obj, args);
          }
        }
      } catch (error) {
        console.warn(`메서드 ${methodName} 호출 실패:`, error);
      }
      return defaultValue;
    },
    []
  );

  // Monaco Editor의 위치 계산 메서드를 안전하게 호출
  const getScrolledVisiblePosition = useCallback(
    (editor: MonacoEditorInstance, position: Position): PixelPosition | null => {
      return safelyCallMethod(editor, 'getScrolledVisiblePosition', null, position);
    },
    [safelyCallMethod]
  );

  // Monaco Editor의 옵션을 안전하게 가져오기
  const getEditorOption = useCallback(
    (editor: MonacoEditorInstance, optionId: number): unknown => {
      return safelyCallMethod(editor, 'getOption', 14, optionId);
    },
    [safelyCallMethod]
  );

  // 커서 위치 계산 함수
  const calculateCursorPosition = useCallback(
    (
      user: (typeof users)[0],
      container: HTMLElement,
      editor: MonacoEditorInstance
    ): CursorPosition | null => {
      if (!user.cursor?.line || !user.cursor?.column) return null;

      try {
        const position: Position = {
          lineNumber: user.cursor.line,
          column: user.cursor.column,
        };

        // Monaco Editor의 내장 메서드 사용 시도
        const pixelPosition = getScrolledVisiblePosition(editor, position);

        if (pixelPosition && pixelPosition.left >= 0 && pixelPosition.top >= 0) {
          return {
            x: pixelPosition.left,
            y: pixelPosition.top,
            userId: user.id,
            userName: user.name,
            userColor: user.color,
          };
        }

        // 수동 계산 폴백
        const lineElement = container.querySelector(
          `.view-line[data-line-number="${user.cursor.line}"], .view-line:nth-child(${user.cursor.line})`
        ) as HTMLElement;

        if (lineElement) {
          const containerRect = container.getBoundingClientRect();
          const lineRect = lineElement.getBoundingClientRect();

          // 문자 너비 계산 (폰트 크기 기반)
          const fontSize = (getEditorOption(editor, 40) as number) || 14;
          const charWidth = fontSize * 0.6;

          const x = lineRect.left - containerRect.left + (user.cursor.column - 1) * charWidth;
          const y = lineRect.top - containerRect.top;

          if (x >= 0 && y >= 0) {
            return {
              x,
              y,
              userId: user.id,
              userName: user.name,
              userColor: user.color,
            };
          }
        }
      } catch (error) {
        console.warn(`커서 위치 계산 실패 (사용자: ${user.name}):`, error);
      }

      return null;
    },
    [getScrolledVisiblePosition, getEditorOption]
  );

  // 커서 위치 업데이트 함수
  const updateCursors = useCallback(() => {
    if (!editorContainer || !monacoEditor) return;

    const newCursors: CursorPosition[] = [];

    users.forEach(user => {
      const cursorPosition = calculateCursorPosition(user, editorContainer, monacoEditor);
      if (cursorPosition) {
        newCursors.push(cursorPosition);
      }
    });

    setCursors(newCursors);
  }, [users, editorContainer, monacoEditor, calculateCursorPosition]);

  // 이벤트 리스너 등록을 위한 헬퍼 함수
  const addEditorEventListener = useCallback(
    (
      editor: MonacoEditorInstance,
      eventName: string,
      callback: () => void
    ): (() => void) | null => {
      try {
        const disposable = safelyCallMethod(editor, eventName, null, callback);
        if (disposable && typeof disposable === 'object' && 'dispose' in disposable) {
          return () => {
            try {
              (disposable as { dispose: () => void }).dispose();
            } catch (error) {
              console.warn(`${eventName} 이벤트 리스너 해제 실패:`, error);
            }
          };
        }
      } catch (error) {
        console.warn(`${eventName} 이벤트 리스너 등록 실패:`, error);
      }
      return null;
    },
    [safelyCallMethod]
  );

  // 디바운스된 업데이트 함수
  const debouncedUpdateCursors = useMemo(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(updateCursors, 16); // ~60fps
    };
  }, [updateCursors]);

  // 이벤트 리스너 및 업데이트 설정
  useEffect(() => {
    if (!editorContainer || !monacoEditor) return;

    // 초기 업데이트
    updateCursors();

    const cleanupFunctions: Array<(() => void) | null> = [];

    // Monaco Editor 이벤트 리스너들
    const scrollCleanup = addEditorEventListener(
      monacoEditor,
      'onDidScrollChange',
      debouncedUpdateCursors
    );
    const layoutCleanup = addEditorEventListener(
      monacoEditor,
      'onDidLayoutChange',
      debouncedUpdateCursors
    );

    cleanupFunctions.push(scrollCleanup, layoutCleanup);

    // 창 크기 변경 이벤트
    const handleResize = () => {
      setTimeout(updateCursors, 100);
    };
    window.addEventListener('resize', handleResize);
    cleanupFunctions.push(() => window.removeEventListener('resize', handleResize));

    // 주기적 업데이트 (1초마다)
    const intervalId = setInterval(updateCursors, 1000);
    cleanupFunctions.push(() => clearInterval(intervalId));

    // 정리 함수
    return () => {
      cleanupFunctions.forEach(cleanup => {
        if (cleanup) cleanup();
      });
    };
  }, [
    updateCursors,
    debouncedUpdateCursors,
    editorContainer,
    monacoEditor,
    addEditorEventListener,
  ]);

  // 메모화된 커서 렌더링
  const renderedCursors = useMemo(() => {
    return cursors.map(cursor => (
      <div
        key={cursor.userId}
        className={styles.cursor}
        style={{
          left: `${cursor.x}px`,
          top: `${cursor.y}px`,
          borderLeftColor: cursor.userColor,
        }}
      >
        <div className={styles.cursorLabel} style={{ backgroundColor: cursor.userColor }}>
          {cursor.userName}
        </div>
      </div>
    ));
  }, [cursors]);

  // 커서가 없거나 컨테이너가 없으면 렌더링하지 않음
  if (!editorContainer || cursors.length === 0) {
    return null;
  }

  return <div className={`${styles.cursorOverlay} ${className || ''}`}>{renderedCursors}</div>;
};

export default CursorOverlay;
