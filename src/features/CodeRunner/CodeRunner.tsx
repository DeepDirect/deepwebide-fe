import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { useThemeStore } from '@/stores/themeStore';
import { useCodeRunnerExecute } from '@/features/Repo/codeRunner/hooks/useCodeRunnerExecute';
import './CodeRunner.scss';

export interface CodeRunnerProps {
  repoId?: number | string;
  repositoryName?: string;
}

interface CommandHistory {
  command: string;
  output: string | JSX.Element;
  timestamp: Date;
}

export function CodeRunner(props: CodeRunnerProps) {
  const [commandHistory, setCommandHistory] = useState<CommandHistory[]>([
    {
      command: '',
      output: 'Hello DeepWebIDE!',
      timestamp: new Date(),
    },
  ]);
  const [currentCommand, setCurrentCommand] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // 다크 모드 초기화
  const { initializeTheme } = useThemeStore();

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  // CodeRunner 실행 훅
  const codeRunnerExecute = useCodeRunnerExecute(props.repoId);

  // 실행 함수 (비동기)
  const executeCommand = (command: string) => {
    setCommandHistory(prev => [...prev, { command, output: '실행 중...', timestamp: new Date() }]);
    setCurrentCommand('');

    codeRunnerExecute.mutate(undefined, {
      onSuccess: resp => {
        let output: string | JSX.Element =
          resp.status === 'SUCCESS' ? resp.output || resp.message : resp.error || resp.message;

        // 포트가 있으면 링크 출력
        if (resp.port) {
          const url = `http://localhost:${resp.port}`;
          output = (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#53aaff', textDecoration: 'underline', cursor: 'pointer' }}
            >
              {url}
            </a>
          );
        }

        setCommandHistory(prev => [
          ...prev.slice(0, -1),
          {
            command,
            output,
            timestamp: new Date(),
          },
        ]);
      },
      onError: (e: unknown) => {
        let errorMessage = '실패';
        if (typeof e === 'object' && e !== null) {
          const err = e as { response?: { data?: { message?: string } }; message?: string };
          errorMessage = err.response?.data?.message || err.message || '실패';
        }
        setCommandHistory(prev => [
          ...prev.slice(0, -1),
          {
            command,
            output: errorMessage,
            timestamp: new Date(),
          },
        ]);
      },
    });
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(currentCommand.trim());
    }
  };

  // 새로운 내용이 추가될 때마다 스크롤을 맨 아래로 이동
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [commandHistory]);

  return (
    <div className="code-runner">
      {/* 제어 섹션 */}
      <div className="code-runner__controls">
        {/* 실행 버튼 */}
        <button
          className="code-runner__control-button"
          aria-label="실행"
          onClick={() => {
            executeCommand(currentCommand.trim());
          }}
        >
          <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M10 20H8V4h2v2h2v3h2v2h2v2h-2v2h-2v3h-2v2z" fill="currentColor" />
          </svg>
        </button>
        {/* 정지 버튼 */}
        <button className="code-runner__control-button" aria-label="정지">
          <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M10 4H5v16h5V4zm9 0h-5v16h5V4z" fill="currentColor" />
          </svg>
        </button>
      </div>

      {/* 터미널 콘텐츠 */}
      <div className="code-runner__content" ref={contentRef}>
        <div className="code-runner__output-section">
          {commandHistory.map((item, index) => (
            <div key={index}>
              {item.command && (
                <div className="code-runner__output-line">
                  <span className="code-runner__prompt">
                    <span className="code-runner__project-path">
                      my/{props.repositoryName ?? 'project-name'}
                    </span>
                  </span>
                  <span className="code-runner__command">{item.command}</span>
                </div>
              )}
              {item.output && (
                <div className="code-runner__output-line">
                  {/* output이 JSX(링크)이면 그대로, 문자열이면 span으로 */}
                  {typeof item.output === 'string' ? (
                    <span className="code-runner__output">{item.output}</span>
                  ) : (
                    item.output
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="code-runner__input-section">
          <div className="code-runner__input-line">
            <span className="code-runner__prompt">
              <span className="code-runner__project-path">
                my/{props.repositoryName ?? 'project-name'}
              </span>
            </span>
            <input
              ref={inputRef}
              type="text"
              className="code-runner__command-input"
              value={currentCommand}
              onChange={e => setCurrentCommand(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="명령어를 입력하세요"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CodeRunner;
