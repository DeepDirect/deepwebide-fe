import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { useThemeStore } from '@/stores/themeStore';
import { useCodeRunnerExecute } from '@/features/Repo/codeRunner/hooks/useCodeRunnerExecute';
import { useCodeRunnerStop } from '@/features/Repo/codeRunner/hooks/useCodeRunnerStop';
import { useCodeRunnerLogs } from '@/features/Repo/codeRunner/hooks/useCodeRunnerLogs';
import './CodeRunner.scss';
import type { JSX } from 'react/jsx-runtime';

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

  // 실시간 로그 한 줄씩 누적용
  const [isStreamingLogs, setIsStreamingLogs] = useState(false);
  const [streamedLogLines, setStreamedLogLines] = useState<string[]>([]);

  // 다크 모드 초기화
  const { initializeTheme } = useThemeStore();
  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  // 실행/중지 커스텀 훅
  const codeRunnerExecute = useCodeRunnerExecute(props.repoId);
  const codeRunnerStop = useCodeRunnerStop(props.repoId);

  // logs: enabled=false, refetch로 직접 요청
  const { data: logsData, refetch: refetchLogs } = useCodeRunnerLogs(props.repoId);

  // logs 명령어 처리: refetchLogs() 호출, streaming 준비
  const executeCommand = (command: string) => {
    if (!command) return;
    if (command === 'logs') {
      setStreamedLogLines([]);
      setCommandHistory(prev => [
        ...prev,
        { command, output: '로그 불러오는 중...', timestamp: new Date() },
      ]);
      setCurrentCommand('');
      refetchLogs();
      setIsStreamingLogs(true);
      return;
    }

    setCommandHistory(prev => [...prev, { command, output: '실행 중...', timestamp: new Date() }]);
    setCurrentCommand('');

    codeRunnerExecute.mutate(undefined, {
      onSuccess: resp => {
        let output: string | JSX.Element =
          resp.status === 'SUCCESS' ? resp.output || resp.message : resp.error || resp.message;

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

        // ★★★ run 실행 후 자동 logs 호출
        if (command === 'run' || command === '') {
          // 기존 logs 출력 지우고 새로
          setTimeout(() => {
            executeCommand('logs');
          }, 350);
        }
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

  // logsData가 오면 한 줄씩 streaming
  useEffect(() => {
    if (!isStreamingLogs || !logsData?.logs) return;

    const lines = logsData.logs.split('\n');
    let idx = 0;

    // "로그 불러오는 중..." 제거
    setCommandHistory(prev => prev.slice(0, -1));
    setStreamedLogLines([]); // 초기화

    const interval = setInterval(() => {
      setStreamedLogLines(prev => {
        // 안전하게 lines[idx]가 undefined일 경우 빈 문자열로 대체
        const line = idx < lines.length && typeof lines[idx] === 'string' ? lines[idx] : '';
        return [...prev, line];
      });
      idx++;
      if (idx >= lines.length) {
        clearInterval(interval);
        setIsStreamingLogs(false);
      }
    }, 60);

    return () => clearInterval(interval);
  }, [isStreamingLogs, logsData]);

  // streamedLogLines 변경 시 commandHistory logs에 누적 반영
  useEffect(() => {
    if (streamedLogLines.length === 0) return;

    setCommandHistory(prev => [
      // 기존 logs 명령 결과는 지움
      ...prev.filter(item => item.command !== 'logs'),
      {
        command: 'logs',
        output: (
          <div
            style={{
              fontFamily: 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              color: '#fff',
              background: '#181a20',
              fontSize: '1em',
              lineHeight: 1.7,
              padding: '16px',
              borderRadius: 8,
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              textAlign: 'left',
            }}
          >
            {streamedLogLines.map((line, idx) => (
              <div key={idx}>{typeof line === 'string' ? line.trimStart() : ''}</div>
            ))}
          </div>
        ),
        timestamp: new Date(),
      },
    ]);
  }, [streamedLogLines]);

  const handleStop = () => {
    setCommandHistory(prev => [
      ...prev,
      { command: 'stop', output: '중지 중...', timestamp: new Date() },
    ]);
    codeRunnerStop.mutate(undefined, {
      onSuccess: resp => {
        setCommandHistory(prev => [
          ...prev.slice(0, -1),
          {
            command: 'stop',
            output: resp.message,
            timestamp: new Date(),
          },
        ]);
      },
      onError: e => {
        let errorMessage = '중지 실패';
        if (typeof e === 'object' && e !== null) {
          const err = e as { response?: { data?: { message?: string } }; message?: string };
          errorMessage = err.response?.data?.message || err.message || '중지 실패';
        }
        setCommandHistory(prev => [
          ...prev.slice(0, -1),
          {
            command: 'stop',
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

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [commandHistory]);

  return (
    <div className="code-runner">
      {/* 제어 섹션 */}
      <div className="code-runner__controls">
        <button
          className="code-runner__control-button"
          aria-label="실행"
          onClick={() => {
            executeCommand(currentCommand.trim() || 'run');
          }}
        >
          <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M10 20H8V4h2v2h2v3h2v2h2v2h-2v2h-2v3h-2v2z" fill="currentColor" />
          </svg>
        </button>
        <button className="code-runner__control-button" aria-label="정지" onClick={handleStop}>
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
