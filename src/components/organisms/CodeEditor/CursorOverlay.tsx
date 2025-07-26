import React, { useEffect, useState } from 'react';
import { useCollaborationStore } from '@/stores/collaborationStore';
import styles from './CursorOverlay.module.scss';

// Monaco Editor 인스턴스 타입 정의
interface MonacoEditorInstance {
  getScrolledVisiblePosition(position: { lineNumber: number; column: number }): {
    left: number;
    top: number;
  } | null;
  getOption(optionId: number): unknown;
  onDidScrollChange(callback: () => void): { dispose(): void } | null;
  onDidLayoutChange(callback: () => void): { dispose(): void } | null;
  getScrollTop(): number;
  getScrollLeft(): number;
}

interface CursorOverlayProps {
  editorContainer: HTMLElement | null;
  monacoEditor?: MonacoEditorInstance | null;
}

interface CursorPosition {
  x: number;
  y: number;
  userId: string;
  userName: string;
  userColor: string;
}

const CursorOverlay: React.FC<CursorOverlayProps> = ({ editorContainer, monacoEditor }) => {
  const { users } = useCollaborationStore();
  const [cursors, setCursors] = useState<CursorPosition[]>([]);

  useEffect(() => {
    if (!editorContainer || !monacoEditor) return;

    const updateCursors = () => {
      const newCursors: CursorPosition[] = [];

      users.forEach(user => {
        if (!user.cursor || !user.cursor.line || !user.cursor.column) return;

        try {
          //Monaco Editor의 getScrolledVisiblePosition 사용
          const position = monacoEditor.getScrolledVisiblePosition({
            lineNumber: user.cursor.line,
            column: user.cursor.column,
          });

          if (position && position.left >= 0 && position.top >= 0) {
            newCursors.push({
              x: position.left,
              y: position.top,
              userId: user.id,
              userName: user.name,
              userColor: user.color,
            });
            return;
          }

          //수동 계산
          const lineElement = editorContainer.querySelector(
            `.view-line[data-line-number="${user.cursor.line}"], .view-line:nth-child(${user.cursor.line})`
          ) as HTMLElement;

          if (lineElement) {
            const containerRect = editorContainer.getBoundingClientRect();
            const lineRect = lineElement.getBoundingClientRect();

            // 문자 너비 계산
            const fontSize = (monacoEditor.getOption(40) as number) || 14;
            const charWidth = fontSize * 0.6;

            const x = lineRect.left - containerRect.left + (user.cursor.column - 1) * charWidth;
            const y = lineRect.top - containerRect.top;

            if (x >= 0 && y >= 0) {
              newCursors.push({
                x,
                y,
                userId: user.id,
                userName: user.name,
                userColor: user.color,
              });
            }
          }
        } catch (error) {
          console.warn(`커서 위치 계산 실패 (사용자: ${user.name}):`, error);
        }
      });

      setCursors(newCursors);
    };

    // 초기 업데이트
    updateCursors();

    const disposables: Array<{ dispose(): void }> = [];

    // Monaco Editor 스크롤 이벤트
    const scrollDisposable = monacoEditor.onDidScrollChange?.(updateCursors);
    if (scrollDisposable) {
      disposables.push(scrollDisposable);
    }

    // Monaco Editor 레이아웃 변경
    const layoutDisposable = monacoEditor.onDidLayoutChange?.(updateCursors);
    if (layoutDisposable) {
      disposables.push(layoutDisposable);
    }

    // 창 크기 변경
    const handleResize = () => {
      setTimeout(updateCursors, 100); // 레이아웃 완료 후 업데이트
    };
    window.addEventListener('resize', handleResize);

    // 사용자 정보 변경 시 업데이트
    const intervalId = setInterval(updateCursors, 1000); // 1초마다 위치 재계산

    return () => {
      disposables.forEach(disposable => {
        disposable.dispose();
      });
      window.removeEventListener('resize', handleResize);
      clearInterval(intervalId);
    };
  }, [users, editorContainer, monacoEditor]);

  if (!editorContainer || cursors.length === 0) {
    return null;
  }

  return (
    <div className={styles.cursorOverlay}>
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
