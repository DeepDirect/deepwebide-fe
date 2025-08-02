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

  // 스크롤 위치 가져오기
  const getScrollInfo = useCallback(
    (editor: MonacoEditorInstance) => {
      try {
        const scrollTop = safelyCallMethod(editor, 'getScrollTop', 0);
        const scrollLeft = safelyCallMethod(editor, 'getScrollLeft', 0);
        return { scrollTop, scrollLeft };
      } catch (error) {
        console.warn('스크롤 정보 가져오기 실패:', error);
        return { scrollTop: 0, scrollLeft: 0 };
      }
    },
    [safelyCallMethod]
  );

  // 라인 높이 가져오기
  const getLineHeight = useCallback(
    (editor: MonacoEditorInstance): number => {
      try {
        return (getEditorOption(editor, 59) as number) || 19; // EditorOption.lineHeight = 59
      } catch (error) {
        console.warn('라인 높이 가져오기 실패:', error);
        return 19; // 기본값
      }
    },
    [getEditorOption]
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

        // Monaco Editor의 getScrolledVisiblePosition을 먼저 시도
        const pixelPosition = getScrolledVisiblePosition(editor, position);

        if (pixelPosition && pixelPosition.left >= 0 && pixelPosition.top >= 0) {
          console.log('Monaco 내장 메서드로 커서 위치 계산 성공:', {
            user: user.name,
            line: user.cursor.line,
            column: user.cursor.column,
            x: pixelPosition.left,
            y: pixelPosition.top,
          });

          return {
            x: pixelPosition.left,
            y: pixelPosition.top,
            userId: user.id,
            userName: user.name,
            userColor: user.color,
          };
        }

        // 폴백 계산 - 스크롤 위치 고려
        console.log('Monaco 내장 메서드 실패, 폴백 계산 시도:', {
          user: user.name,
          line: user.cursor.line,
          column: user.cursor.column,
        });

        const scrollInfo = getScrollInfo(editor);
        const lineHeight = getLineHeight(editor);
        const fontSize = (getEditorOption(editor, 40) as number) || 14; // EditorOption.fontSize = 40
        const charWidth = fontSize * 0.6; // 대략적인 문자 너비

        // 스크롤을 고려한 위치 계산
        const lineY = (user.cursor.line - 1) * lineHeight - scrollInfo.scrollTop;
        const columnX = (user.cursor.column - 1) * charWidth - scrollInfo.scrollLeft;

        // 뷰포트 내에 있는지 확인
        const editorHeight = container.clientHeight;
        const editorWidth = container.clientWidth;

        if (lineY < 0 || lineY > editorHeight || columnX < 0 || columnX > editorWidth) {
          console.log('📍 커서가 뷰포트 밖에 있음:', {
            user: user.name,
            lineY,
            columnX,
            editorHeight,
            editorWidth,
            scrollTop: scrollInfo.scrollTop,
            scrollLeft: scrollInfo.scrollLeft,
          });
          return null; // 뷰포트 밖에 있으면 표시하지 않음
        }

        console.log('폴백 계산으로 커서 위치 계산 성공:', {
          user: user.name,
          line: user.cursor.line,
          column: user.cursor.column,
          x: columnX,
          y: lineY,
          scrollTop: scrollInfo.scrollTop,
          scrollLeft: scrollInfo.scrollLeft,
        });

        return {
          x: columnX,
          y: lineY,
          userId: user.id,
          userName: user.name,
          userColor: user.color,
        };
      } catch (error) {
        console.warn(`커서 위치 계산 실패 (사용자: ${user.name}):`, error);
      }

      return null;
    },
    [getScrolledVisiblePosition, getEditorOption, getScrollInfo, getLineHeight]
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

    // 스크롤 이벤트를 더 적극적으로 감지
    const scrollCleanup = addEditorEventListener(
      monacoEditor,
      'onDidScrollChange',
      updateCursors // 즉시 업데이트 (디바운싱 제거)
    );
    const layoutCleanup = addEditorEventListener(
      monacoEditor,
      'onDidLayoutChange',
      debouncedUpdateCursors
    );

    // 커서 위치 변경 이벤트도 감지
    const cursorCleanup = addEditorEventListener(
      monacoEditor,
      'onDidChangeCursorPosition',
      debouncedUpdateCursors
    );

    cleanupFunctions.push(scrollCleanup, layoutCleanup, cursorCleanup);

    // 창 크기 변경 이벤트
    const handleResize = () => {
      setTimeout(updateCursors, 100);
    };
    window.addEventListener('resize', handleResize);
    cleanupFunctions.push(() => window.removeEventListener('resize', handleResize));

    // 더 빈번한 업데이트 (500ms마다)
    const intervalId = setInterval(updateCursors, 500);
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
