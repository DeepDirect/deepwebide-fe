import React, { useEffect, useState, useCallback } from 'react';
import { useCollaborationStore } from '@/stores/collaborationStore';
import type { MonacoEditorInstance } from '@/types/monaco.types';
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

  // 커서 위치 계산 함수
  const calculateCursorPosition = useCallback(
    (
      user: (typeof users)[0],
      editorContainer: HTMLElement,
      monacoEditor: MonacoEditorInstance
    ): CursorPosition | null => {
      if (!user.cursor?.line || !user.cursor?.column) return null;

      try {
        // Monaco Editor의 메서드들을 타입 확장으로 접근
        const editorWithMethods = monacoEditor as MonacoEditorInstance & {
          getScrolledVisiblePosition?: (position: { lineNumber: number; column: number }) => {
            left: number;
            top: number;
          } | null;
          getOption?: (optionId: number) => unknown;
        };

        const position = editorWithMethods.getScrolledVisiblePosition?.({
          lineNumber: user.cursor.line,
          column: user.cursor.column,
        });

        if (position && position.left >= 0 && position.top >= 0) {
          return {
            x: position.left,
            y: position.top,
            userId: user.id,
            userName: user.name,
            userColor: user.color,
          };
        }

        // 수동 계산 폴백
        const lineElement = editorContainer.querySelector(
          `.view-line[data-line-number="${user.cursor.line}"], .view-line:nth-child(${user.cursor.line})`
        ) as HTMLElement;

        if (lineElement) {
          const containerRect = editorContainer.getBoundingClientRect();
          const lineRect = lineElement.getBoundingClientRect();

          // 문자 너비 계산
          const fontSize = (editorWithMethods.getOption?.(40) as number) || 14;
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
    []
  );

  // 커서 위치 업데이트
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

  useEffect(() => {
    if (!editorContainer || !monacoEditor) return;

    // 초기 업데이트
    updateCursors();

    const disposables: Array<{ dispose(): void }> = [];

    // Monaco Editor 이벤트 리스너
    const editorWithEvents = monacoEditor as MonacoEditorInstance & {
      onDidScrollChange?: (callback: () => void) => { dispose(): void } | null;
      onDidLayoutChange?: (callback: () => void) => { dispose(): void } | null;
    };

    const scrollDisposable = editorWithEvents.onDidScrollChange?.(updateCursors);
    if (scrollDisposable) {
      disposables.push(scrollDisposable);
    }

    const layoutDisposable = editorWithEvents.onDidLayoutChange?.(updateCursors);
    if (layoutDisposable) {
      disposables.push(layoutDisposable);
    }

    // 창 크기 변경 이벤트
    const handleResize = () => {
      setTimeout(updateCursors, 100);
    };
    window.addEventListener('resize', handleResize);

    // 주기적 업데이트
    const intervalId = setInterval(updateCursors, 1000);

    return () => {
      disposables.forEach(disposable => disposable.dispose());
      window.removeEventListener('resize', handleResize);
      clearInterval(intervalId);
    };
  }, [updateCursors, editorContainer, monacoEditor]);

  if (!editorContainer || cursors.length === 0) {
    return null;
  }

  return (
    <div className={`${styles.cursorOverlay} ${className || ''}`}>
      {cursors.map(cursor => (
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
      ))}
    </div>
  );
};

export default CursorOverlay;
